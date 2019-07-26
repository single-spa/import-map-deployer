'use strict'
// File editing
const lock = new (require('rwlock'))()
const ioOperations = require('./io-operations.js')
const config = require('./config').config

const isImportMap = config && config.manifestFormat === 'importmap'

function getMapFromManifest(manifest) {
  return isImportMap ? manifest.imports : manifest.sofe.manifest
}

function getEmptyManifest() {
  return isImportMap ? {imports: {}} : {sofe: {manifest: {}}}
}

exports.getEmptyManifest = getEmptyManifest

exports.modifyService = function(env, serviceName, url, remove) {
  return new Promise((resolve, reject) => {
    // obtain lock (we need a global lock so deploys dont have a race condition)
    lock.writeLock(function (release) {
      // read file as json
      const manifestPromise = ioOperations.readManifest(env)
        .then((data) => {
          var json
          if ( data==='' ) {
            json = getEmptyManifest()
          } else {
            try {
              json = JSON.parse(data)
            } catch(ex) {
              release()
              reject('Manifest is not valid json -- ' + ex)
              return
            }
          }

          // modify json
          if ( remove ) {
            delete getMapFromManifest(json)[serviceName]
          } else {
            getMapFromManifest(json)[serviceName] = url
          }

          // write json to file
          var string = JSON.stringify(json, null, 2)
          return ioOperations.writeManifest(string, env)
            .then(() => {
              release()
              return json
            })
        })
        .catch((ex) => {
          release()
          throw ex
        })

      resolve(manifestPromise)
    })
  })
}

exports.modifyMultipleServices = function(env, newImports) {
  return new Promise((resolve, reject) => {
    lock.writeLock(releaseLock => {
      const resultPromise = ioOperations.readManifest(env)
        .then(data => {
          const json = data ? JSON.parse(data) : getEmptyManifest()

          const imports = getMapFromManifest(json)
          Object.assign(imports, newImports)

          const newImportMapString = JSON.stringify(json, null, 2)
          return ioOperations.writeManifest(newImportMapString, env)
            .then(() => {
              releaseLock()
              return json
            })
        })
        .catch(err => {
          releaseLock()
          throw err
        })

      resolve(resultPromise)
    })
  })
}