'use strict'
const ioOperations = require('./io-operations.js')

exports.runCheck = function() {
  return new Promise((resolve, reject) => {
    let firstThingRead
    ioOperations.readManifest()
    .then((firstManifest) => {
      firstThingRead = firstManifest
      ioOperations.writeManifest(firstManifest)
      .then(() => {
        ioOperations.readManifest()
        .then((secondManifest) => {
          if (firstManifest !== secondManifest) {
            reject(new Error(`Health check failed - reading then writing the same then reading should be idempotent`))
          } else {
            console.log('Health check complete')
            resolve()
          }
        })
        .catch((ex) => reject(ex))
      })
      .catch((ex) => reject(ex))
    })
    .catch((ex) => reject(ex))
  })
}
