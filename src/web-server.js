//Setup
"use strict";
require("dotenv").config();

const express = require("express"),
  bodyParser = require("body-parser"),
  app = express(),
  ioOperations = require("./io-operations.js"),
  modify = require("./modify.js"),
  healthCheck = require("./health-check.js"),
  auth = require("./auth.js"),
  envHelpers = require("./environment-helpers.js"),
  _ = require("lodash"),
  morgan = require("morgan"),
  {
    verifyValidUrl,
    findUrlsToValidateInScopes,
    findUrlsToValidateInServices,
  } = require("./verify-valid-url.js"),
  {
    verifyInputFormatForServices,
    verifyInputFormatForScopes,
  } = require("./verify-valid-input-format"),
  getConfig = require("./config.js").getConfig,
  setConfig = require("./config.js").setConfig,
  { checkUrlUnsafe } = require("./trusted-urls");

if (process.env.NODE_ENV !== "test") {
  healthCheck.runCheck().catch((ex) => {
    console.error(ex);
    console.error("Killing web server because initial health check failed");
    process.exit(1);
  });
}

app.set("etag", false);
app.use(bodyParser.text({ type: "*/*" }));
app.use(
  morgan(
    function (tokens, req, res) {
      return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        JSON.stringify(req.body),
      ].join(" ");
    },
    {
      skip: (req, res) => {
        return (
          (req.url === "/health" || req.url === "/") && res.statusCode == 200
        );
      },
    }
  )
);
app.use(auth);
app.use(express.static(__dirname + "/public"));

function getEnv(req) {
  return req.query.env;
}

function sendError(res, ex, prefix) {
  const status =
    ex && ex.message && /No such environment/.test(ex.message) ? 404 : 500;
  res.status(status).send(`${prefix} -- ${ex.toString()}`);
}

// --------- //
// ENDPOINTS //
// --------- //
// app.get('/', function(req, res) {
//   res.send(`try doing a GET on /sofe-manifest, a PATCH on /services, or a DELETE on /services/:serviceName`)
// })

app.get("/environments", function (req, res) {
  res.send({
    environments: notEmpty(envHelpers.getEnvNames()).map(toEnvObject),
  });

  function notEmpty(envs) {
    return envs.length > 0 ? envs : ["default"];
  }

  function toEnvObject(name) {
    return {
      name: name,
      isDefault: isDefault(name),
      aliases: aliases(name),
    };
  }

  function isDefault(name) {
    return (
      name === "default" ||
      envHelpers.getEnvLocation(name) === envHelpers.getEnvLocation("default")
    );
  }

  function aliases(envName) {
    return envHelpers.getEnvNames().filter((name) => {
      return (
        envName !== name &&
        envHelpers.getEnvLocation(name) === envHelpers.getEnvLocation(envName)
      );
    });
  }
});

app.get("/sofe-manifest.json", handleGetManifest);
app.get("/import-map.json", handleGetManifest);

function handleGetManifest(req, res) {
  let env = getEnv(req);
  ioOperations
    .readManifest(env)
    .then((data) => {
      var json = JSON.parse(data);
      res.send(json);
    })
    .catch((ex) => {
      console.error(ex);
      sendError(res, ex, "Could not read import map");
    });
}

app.patch("/import-map.json", (req, res) => {
  const env = getEnv(req);
  try {
    req.body = JSON.parse(req.body);
  } catch (err) {
    console.error(err);
    res
      .status(400)
      .send("Patching the import map requires a json request body");
    return;
  }
  if (req.body.imports) {
    const inputFormatIssues = verifyInputFormatForServices(req.body.imports);
    if (inputFormatIssues.length > 0) {
      res.status(400).send(inputFormatIssues.join("\n"));
      return;
    }
  }
  if (req.body.scopes) {
    if (getConfig().manifestFormat !== "importmap") {
      return res
        .status(400)
        .send(
          `Invalid import map in request body -- scopes are only supported with manifest format "importmap"`
        );
    }

    const inputFormatIssues = verifyInputFormatForScopes(req.body.scopes);
    if (inputFormatIssues.length > 0) {
      res.status(400).send(inputFormatIssues.join("\n"));
      return;
    }
  }

  // Import map validation
  let validImportUrlPromises = Promise.resolve();
  if (req.body.imports) {
    const importUrlsToValidate = findUrlsToValidateInServices(req.body.imports);
    const unsafeUrls = importUrlsToValidate.map(checkUrlUnsafe).filter(Boolean);

    if (unsafeUrls.length > 0) {
      return res.status(400).send({
        error: `The following URLs are not trusted - ${unsafeUrls.join(", ")}`,
      });
    }

    if (importUrlsToValidate.length > 0) {
      validImportUrlPromises = importUrlsToValidate.map((url) =>
        verifyValidUrl(req, url)
      );
    }
  }

  // Scope validation
  let validScopeUrlPromises = Promise.resolve();
  if (req.body.scopes) {
    const scopeUrlsToValidate = findUrlsToValidateInScopes(req.body.scopes);
    const unsafeUrls = scopeUrlsToValidate.map(checkUrlUnsafe).filter(Boolean);

    if (unsafeUrls.length > 0) {
      return res.status(400).send({
        error: `The following URLs are not trusted - ${unsafeUrls.join(", ")}`,
      });
    }

    if (scopeUrlsToValidate.length > 0) {
      validScopeUrlPromises = scopeUrlsToValidate.map((url) =>
        verifyValidUrl(req, url)
      );
    }
  }

  return Promise.all([validImportUrlPromises, validScopeUrlPromises])
    .then(() => {
      modify
        .modifyImportMap(env, {
          services: req.body.imports,
          scopes: req.body.scopes,
        })
        .then((newImportMap) => {
          res.status(200).send(newImportMap);
        })
        .catch((err) => {
          sendError(res, err, "Could not update import map");
        });
    })
    .catch((err) => {
      res.status(400).send(err.message);
    });
});

app.get("/", healthEndpoint);
app.get("/health", healthEndpoint);

function healthEndpoint(req, res) {
  res.send({
    message: "import-map-deployer is running",
  });
}

app.patch("/services", function (req, res) {
  req.body = JSON.parse(req.body);
  let service, url;
  let env = getEnv(req);
  if (req.body != undefined && req.body.hasOwnProperty("service")) {
    service = req.body.service;
  } else {
    return res.status(400).send("service key is missing");
  }
  if (!service || service.trim().length === 0) {
    return res
      .status(400)
      .send(`Invalid service key - "${service}" is an invalid service key`);
  }
  if (req.body != undefined && req.body.hasOwnProperty("url")) {
    url = req.body.url;
  } else {
    return res.status(400).send("url key is missing");
  }

  let packageDirLevel =
    req.query.packageDirLevel && req.query.packageDirLevel !== ""
      ? Math.floor(req.query.packageDirLevel)
      : 1;

  if (req.query.packageDirLevel && isNaN(packageDirLevel)) {
    return res
      .status(400)
      .send(
        `Query parameter packageDirLevel (${packageDirLevel}) should be of type number`
      );
  }

  if (checkUrlUnsafe(url)) {
    return res.status(400).send({
      error: `URL is not trusted (${url})`,
    });
  }

  verifyValidUrl(req, url)
    .then(() => {
      modify
        .modifyService(env, service, url, false, packageDirLevel)
        .then((json) => {
          res.send(json);
        })
        .catch((ex) => {
          sendError(res, ex, "Could not patch service");
        });
    })
    .catch((err) => {
      res.status(400).send(err.message);
    });
});

app.delete("/services/:serviceName", function (req, res) {
  let env = getEnv(req);
  modify
    .modifyService(env, req.params.serviceName, null, true)
    .then((data) => {
      res.send(data);
    })
    .catch((ex) => {
      sendError(res, ex, "Could not delete service");
    });
});

let server;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(
    process.env.PORT || getConfig().port || 5000,
    function () {
      console.log("Listening at http://localhost:%s", server.address().port);
    }
  );

  exports.close = server.close;
}

exports.app = app;
exports.setConfig = setConfig;
