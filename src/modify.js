'use strict';
// File editing
const lock = new (require('rwlock'))()
    , ioOperations = require('./io-operations.js')

exports.modifyService = function(serviceName, url, remove) {
  return new Promise((resolve, reject) => {
    // obtain lock (we need a global lock so deploys dont have a race condition)
    lock.writeLock(function (release) {
      // read file as json
      ioOperations.readManifest()
      .then((data) => {
        var json;
        if ( data==='' ) {
          json = {"sofe":{"manifest":{}}};
        } else {
          try {
            json = JSON.parse(data)
          } catch(ex) {
            release();
            reject('Manifest is not valid json -- ' + ex);
            return;
          }
        }

        // modify json
        if ( remove ) {
          delete json.sofe.manifest[serviceName];
        } else {
          json.sofe.manifest[serviceName] = url;
        }

        // write json to file
        var string = JSON.stringify(json, null, 2)
        ioOperations.writeManifest(string)
        .then(() => {
          release();
          resolve(json);
        })
        .catch((ex) => {
          release();
          throw ex;
        });
      })
      .catch((ex) => {
        release();
        throw ex;
      });
    });
  });
}
