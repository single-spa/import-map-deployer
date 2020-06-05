"use strict";
// File editing
const lock = new (require("rwlock"))();
const ioOperations = require("./io-operations.js");
const config = require("./config").config;

const isImportMap = config && config.manifestFormat === "importmap";

function getScopeFromManifest(manifest, scope = "imports") {
  if (!isImportMap) {
    if (scope !== "imports") {
      throw new Error("Sofe implementations can only support imports");
    }
    return manifest.sofe.manifest;
  } else {
    return manifest[scope] || {};
  }
}

function getEmptyManifest() {
  return isImportMap ? { imports: {}, scopes: {} } : { sofe: { manifest: {} } };
}
const deepCopy = (json) => JSON.parse(JSON.stringify(json));

exports.modifyMultipleServices = function (env, newImports) {
  return modifyMultiple(env, newImports, "imports");
};

exports.modifyService = function (env, serviceName, url, remove) {
  return modifyKeyValue(env, serviceName, url, remove, "imports");
};

exports.modifyMultipleScopes = function (env, newImports) {
  return modifyMultiple(env, newImports, "scopes");
};

exports.modifyScope = function (env, serviceName, url, remove) {
  return modifyKeyValue(env, serviceName, url, remove, "scopes");
};

function modifyMultiple(env, values, manifestScope) {
  return modifyLock(env, (json) => {
    const imports = getScopeFromManifest(json, manifestScope);
    imports[manifestScope] = values;
    return imports;
  });
}

function modifyKeyValue(env, key, value, remove, manifestScope) {
  return modifyLock(env, (json) => {
    const imports = getScopeFromManifest(json, manifestScope);
    if (remove) {
      delete imports[key];
    } else {
      imports[key] = value;
    }
    return imports;
  });
}

function modifyLock(env, modifierFunc) {
  return new Promise((resolve, reject) => {
    // obtain lock (we need a global lock so deploys dont have a race condition)
    lock.writeLock((releaseLock) => {
      // read file as json
      const resultPromise = ioOperations
        .readManifest(env)
        .then((data) => {
          let json;

          // get json from data
          if (data === "") {
            json = getEmptyManifest();
          } else {
            try {
              json = JSON.parse(data);
            } catch (ex) {
              release();
              reject("Manifest is not valid json -- " + ex);
              return;
            }
          }

          // modify json
          json = modifierFunc(deepCopy(json));

          // write json to file
          const newImportMapString = JSON.stringify(json, null, 2);
          return ioOperations
            .writeManifest(newImportMapString, env)
            .then(() => {
              releaseLock();
              return json;
            });
        })
        .catch((err) => {
          releaseLock();
          throw err;
        });

      resolve(resultPromise);
    });
  });
}

exports.getEmptyManifest = getEmptyManifest;
