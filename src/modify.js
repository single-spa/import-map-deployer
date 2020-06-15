"use strict";
// File editing
const lock = new (require("rwlock"))();
const ioOperations = require("./io-operations.js");
const getConfig = require("./config").getConfig;

const isImportMap = () => getConfig().manifestFormat === "importmap";

function getMapFromManifest(manifest) {
  return isImportMap() ? manifest.imports : manifest.sofe.manifest;
}

function getScopesFromManifest(manifest) {
  if (!isImportMap()) {
    throw new Error(
      `Invalid function call, Scopes is not supported for Sofe implementations.`
    );
  }
  return manifest.scopes;
}

function getEmptyManifest() {
  return isImportMap()
    ? { imports: {}, scopes: {} }
    : { sofe: { manifest: {} } };
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
              releaseLock();
              reject("Manifest is not valid json -- " + ex);
              return;
            }
          }

          // modify json
          const deepJsonCopy = JSON.parse(JSON.stringify(json));
          json = modifierFunc(deepJsonCopy);

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

/*
 * Services
 */
exports.modifyMultipleServices = function (env, newImports) {
  return modifyLock(env, (json) => {
    const imports = getMapFromManifest(json);
    if (imports) {
      Object.assign(imports, newImports);
      return json;
    } else {
      const init = getEmptyManifest();
      const imports = getMapFromManifest(init);

      Object.assign(imports, newImports);

      return init;
    }
  });
};

exports.modifyService = function (env, serviceName, url, remove) {
  return modifyLock(env, (json) => {
    const map = getMapFromManifest(json);
    if (remove) {
      delete map[serviceName];
    } else {
      map[serviceName] = url;
    }
    return json;
  });
};

/*
 * Scopes
 */

exports.modifyMultipleScopes = function (env, newScopes) {
  if (newScopes) {
    return modifyLock(env, (json) => {
      const scopes = getScopesFromManifest(json);
      if (scopes) {
        Object.assign(scopes, newScopes);
        return json;
      } else {
        const init = getEmptyManifest();
        const scopes = getScopesFromManifest(init);

        Object.assign(scopes, newScopes);

        return init;
      }
    });
  } else {
    return Promise.resolve();
  }
};

exports.getEmptyManifest = getEmptyManifest;
