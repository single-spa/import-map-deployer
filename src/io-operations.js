"use strict";
const config = require("./config.js").getConfig();
const getEmptyManifest = require("./modify").getEmptyManifest;

let readManifest, writeManifest, username, password;
if (config) {
  if (
    typeof config.readManifest === "function" &&
    typeof config.writeManifest === "function"
  ) {
    readManifest = function (env) {
      const promise = config.readManifest(env);
      if (!(promise instanceof Promise))
        throw new Error(
          `Configuration file provided invalid readManifest function -- expected a Promise to be returned`
        );
      return promise;
    };

    writeManifest = function (string, env) {
      const promise = config.writeManifest(string, env);
      if (!(promise instanceof Promise))
        throw new Error(
          `Configuration file provided invalid writeManifest function -- expected a Promise to be returned`
        );
      return promise;
    };
  } else if (config.readManifest || config.writeManifest) {
    throw new Error(
      `Invalid config file -- readManifest and writeManifest should both be functions`
    );
  } else {
    useDefaultIOMethod();
  }
} else {
  useDefaultIOMethod();
}

if (config) {
  if (
    (typeof config.username === "string" &&
      typeof config.password === "string") ||
    (config.username === undefined && config.password === undefined)
  ) {
    username = config.username;
    password = config.password;
  } else {
    throw new Error(
      `Invalid config file -- username and password should either be strings or missing completely`
    );
  }
}

function useDefaultIOMethod() {
  const defaultIOMethod = require("./io-methods/default.js");
  readManifest = defaultIOMethod.readManifest;
  writeManifest = defaultIOMethod.writeManifest;
}

exports.readManifest = (env) => {
  return new Promise((resolve, reject) => {
    readManifest(env)
      .then((manifest) => {
        if (manifest === "") {
          manifest = JSON.stringify(getEmptyManifest());
        }
        resolve(manifest);
      })
      .catch((ex) => {
        reject(ex);
      });
  });
};

// Override username and password if both env vars are set
if (process.env.IMD_USERNAME && process.env.IMD_PASSWORD) {
  username = process.env.IMD_USERNAME;
  password = process.env.IMD_PASSWORD;
}

exports.writeManifest = writeManifest;
exports.username = username;
exports.password = password;
