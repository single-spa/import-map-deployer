"use strict";
// File editing
const lock = new (require("rwlock"))();
const ioOperations = require("./io-operations.js");
const { getConfig } = require("./config");

const isImportMap = () => {
  const format = getConfig().manifestFormat;
  if (format === "importmap") {
    return true;
  } else if (format === "sofe") {
    return false;
  } else {
    throw new Error(
      `Invalid manifestFormat '${format}'. Must be 'importmap' or 'sofe'.`
    );
  }
};

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

function getIntegrityFromManifest(manifest) {
  if (!isImportMap()) {
    throw Error(`Integrity only supported with manifestFormat "importmap"`);
  }
  return manifest.integrity;
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

exports.modifyImportMap = function (env, newValues) {
  const { services, scopes, integrity } = newValues;

  const alphabetical = !!getConfig().alphabetical;
  const newImports = alphabetical
    ? sortObjectAlphabeticallyByKeys(services)
    : services;
  const newScopes = alphabetical
    ? sortObjectAlphabeticallyByKeys(scopes)
    : scopes;
  const newIntegrity = alphabetical
    ? sortObjectAlphabeticallyByKeys(integrity)
    : integrity;

  // either imports or scopes have to be defined
  return modifyLock(env, (json) => {
    if (newImports) {
      const imports = getMapFromManifest(json);
      Object.assign(imports, newImports);
    }
    if (newScopes) {
      json.scopes = json.scopes ?? {};
      const scopes = getScopesFromManifest(json);
      Object.assign(scopes, newScopes);
    }
    if (newIntegrity) {
      json.integrity = json.integrity ?? {};
      const integrity = getIntegrityFromManifest(json);
      Object.assign(integrity, newIntegrity);
    }
    return json;
  });
};

exports.modifyService = function (
  env,
  serviceName,
  url,
  remove,
  packageDirLevel = 1,
  integrity
) {
  return modifyLock(env, (json) => {
    const map = getMapFromManifest(json);
    const oldUrl = map[serviceName];
    if (oldUrl && json.integrity) {
      delete json.integrity[oldUrl];
    }

    if (remove) {
      delete map[serviceName];
      delete map[serviceName + "/"];
    } else {
      map[serviceName] = url;

      if (
        (getConfig().packagesViaTrailingSlashes ||
          !getConfig().hasOwnProperty("packagesViaTrailingSlashes")) &&
        (url.match(new RegExp("/", "g")) || []).length > 1
      ) {
        const pathToPackageDir =
          packageDirLevel === 1 ? "./" : "../".repeat(packageDirLevel - 1);
        const address =
          url.indexOf("http://") !== -1 || url.indexOf("https://") !== -1
            ? new URL(pathToPackageDir, url).href
            : new URL(
                pathToPackageDir,
                `https://example.com${url.startsWith("/") ? url : "" + url}`
              ).pathname;
        map[serviceName + "/"] = address;
      }

      if (integrity) {
        json.integrity = json.integrity ?? {};
        json.integrity[url] = integrity;
      }
    }
    const alphabetical = !!getConfig().alphabetical;
    if (alphabetical) {
      return {
        imports: sortObjectAlphabeticallyByKeys(json.imports),
        scopes: sortObjectAlphabeticallyByKeys(json.scopes),
      };
    } else {
      return json;
    }
  });
};

exports.getEmptyManifest = getEmptyManifest;

function sortObjectAlphabeticallyByKeys(unordered) {
  if (!unordered) {
    return unordered;
  }
  return Object.keys(unordered)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unordered[key];
      return obj;
    }, {});
}

exports.sortObjectAlphabeticallyByKeys = sortObjectAlphabeticallyByKeys;
