"use strict";
// File editing
const lock = new (require("rwlock"))();
const ioOperations = require("./io-operations.js");
const config = require("./config").config;

const isImportMap = config && config.manifestFormat === "importmap";

// This one helps us contain the Sofe checks in one spot
// * Sofe does not accept scopes
function getEntriesForKey(manifest, key = "imports") {
  if (!isImportMap) {
    if (key !== "imports") {
      throw new Error(
        `Sofe implementations can only support imports, key: [${key}] is not supported`
      );
    }
    return manifest.sofe.manifest;
  } else {
    return manifest[key] || {};
  }
}

function getEmptyManifest() {
  return isImportMap ? { imports: {}, scopes: {} } : { sofe: { manifest: {} } };
}
const deepCopy = (json) => JSON.parse(JSON.stringify(json));

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

/*
 * Services
 */
exports.modifyMultipleServices = function (env, newImports) {
  return modifyLock(env, (json) => {
    const entries = getEntriesForKey(json, "imports");
    entries.imports = newImports;
    return entries;
  });
};

exports.modifyService = function (env, serviceName, url, remove) {
  return modifyLock(env, (json) => {
    const entries = getEntriesForKey(json, "imports");
    if (remove) {
      delete entries[serviceName];
    } else {
      entries[serviceName] = url;
    }
    return entries;
  });
};

/*
 * Scopes
 */

exports.modifyMultipleScopes = function (env, newScopes) {
  return modifyLock(env, (json) => {
    const entries = getEntriesForKey(json, "scopes");
    entries.scopes = newScopes;
    return entries;
  });
};

exports.modifyScope = function (env, scopeSpecifier, scopeMappingObj, remove) {
  return modifyLock(env, (json) => {
    const entries = getEntriesForKey(json, "scopes");
    if (remove) {
      delete entries[scopeSpecifier];
    } else {
      entries[scopeSpecifier] = scopeMappingObj;
    }
    return entries;
  });
};

exports.getEmptyManifest = getEmptyManifest;
