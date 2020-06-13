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
    verifyValidUrlsDefinedByScopes,
  } = require("./verify-valid-url.js"),
  config = require("./config.js").config,
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
  morgan(function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      JSON.stringify(req.body),
    ].join(" ");
  })
);
app.use(auth);
app.use(express.static(__dirname + "/public"));

function getEnv(req) {
  if (req.query.env === undefined) {
    return "default";
  } else {
    return req.query.env;
  }
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
      res.status(500).send(`Could not read manifest file -- ${ex.toString()}`);
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

  if (!req.body.imports || Object.keys(req.body.imports).length === 0) {
    res
      .status(400)
      .send(
        "Invalid import map in request body -- 'imports' object required with modules in it."
      );
    return;
  }

  for (let moduleName in req.body.imports) {
    if (typeof req.body.imports[moduleName] !== "string") {
      res
        .status(400)
        .send(
          `Invalid import map in request body -- module with name '${moduleName}' does not have a string url`
        );
      return;
    }
  }

  if (typeof req.body.scopes && config.manifestFormat !== "importmap") {
    return res
      .status(400)
      .send(
        `Invalid import map in request body -- scopes are only supported with manifest format "importmap"`
      );
  }

  if (typeof req.body.scopes[scopeName] !== "object") {
    return res
      .status(400)
      .send(
        `Invalid import map in request body -- scope with name '${scopeName}' is not an object`
      );
  }

  if (Object.keys(req.body.scopes[scopeName]).length === 0) {
    return res
      .status(400)
      .send(
        `Invalid import map in request body -- scope with name '${scopeName}' is an object with no properties`
      );
  }

  // Confirm the imports are working
  const importUrls = Object.values(req.body.imports);

  const unsafeUrls = importUrls.map(checkUrlUnsafe).filter(Boolean);

  if (unsafeUrls.length > 0) {
    return res.status(400).send({
      error: `The following URLs are not trusted - ${unsafeUrls.join(", ")}`,
    });
  }

  const validImportUrlPromises = importUrls.map((url) =>
    verifyValidUrl(req, url)
  );

  const scopes = req.body.scopes;

  const validScopePromises = Object.keys(scopes).map((scope) => {
    const scopeOverrides = Object.entries(scopes[key]);
    scopeOverrides.map(([specifier, address]) => {
      if (!req.body.imports[specifier]) {
        return res
          .status(400)
          .send(
            `Invalid import map in request body -- scope with specifier '${specifier}' is not defined in the imports object`
          );
      }

      // ToDo: this validation needs more work
      verifyValidUrl(req, address);
    });
  });

  // Confirm scopes are working

  Promise.all([validImportUrlPromises, validScopePromises])
    .then(() => {
      Promise.all([
        modify.modifyMultipleScopes(env, req.body.scopes),
        modify.modifyMultipleServices(env, req.body.imports),
      ])
        .then((newImportMap) => {
          res.status(200).send({
            ...newImportMap[0],
            ...newImportMap[1],
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send(`Could not update import map`);
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
  if (req.body != undefined && req.body.hasOwnProperty("url")) {
    url = req.body.url;
  } else {
    return res.status(400).send("url key is missing");
  }

  if (checkUrlUnsafe(url)) {
    return res.status(400).send({
      error: `URL is not trusted (${url})`,
    });
  }

  verifyValidUrl(req, url)
    .then(() => {
      modify
        .modifyService(env, service, url)
        .then((json) => {
          res.send(json);
        })
        .catch((ex) => {
          console.error(ex);
          res
            .status(500)
            .send(`Could not write manifest file -- ${ex.toString()}`);
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
      console.error(ex);
      res
        .status(500)
        .send(`Could not delete service ${req.params.serviceName}`);
    });
});

let server;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(config.port || 5000, function () {
    console.log("Listening at http://localhost:%s", server.address().port);
  });

  exports.close = server.close;
}

exports.app = app;
exports.setConfig = setConfig;
