'use strict';
const argv = require('minimist')(process.argv.slice(2));

if (argv._.length > 1)
  throw new Error(`sofe-deplanifester expects only a single argument, which is the configuration file`);

let readManifest, writeManifest;
if (argv._.length === 1) {
  const config = require(argv._[0]);
  if (typeof config.readManifest === 'function' && typeof config.writeManifest === 'function') {
    readManifest = function() {
      const promise = config.readManifest();
      if (!(promise instanceof Promise))
        throw new Error(`Configuration file provided invalid readManifest function -- expected a Promise to be returned`);
      return promise;
    }

    writeManifest = function(string) {
      const promise = config.writeManifest(string);
      if (!(promise instanceof Promise))
        throw new Error(`Configuration file provided invalid writeManifest function -- expected a Promise to be returned`);
      return promise;
    }
  } else if (config.readManifest || config.writeManifest) {
    throw new Error(`Invalid config file -- readManifest and writeManifest should both be functions`);
  } else {
    useDefaultIOMethod(config.manifestFilePath);
  }
} else {
  useDefaultIOMethod();
}

function useDefaultIOMethod(filePath) {
  const defaultIOMethod = require('./io-methods/filesystem.js');
  defaultIOMethod.setFilePath(filePath || 'sofe-manifest.json');
  readManifest = defaultIOMethod.readManifest;
  writeManifest = defaultIOMethod.writeManifest;
}

exports.readManifest = () => {
  return new Promise((resolve, reject) => {
    readManifest()
    .then((manifest) => {
      if (manifest === '') {
        manifest = JSON.stringify({
          sofe: {
            manifest: {}
          }
        });
      }
      resolve(manifest);
    })
    .catch((ex) => {
      reject(ex);
    });
  });
}

exports.writeManifest = writeManifest;
