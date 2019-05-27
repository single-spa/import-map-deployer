'use strict'
const _ = require('lodash')
const fs = require('./filesystem')
const s3 = require('./s3')
const config = require('../config').config

const defaultFilePath = config && config.manifestFormat === 'import-map' ? 'import-map.json' : 'sofe-manifest.json'

function getFilePath(env) {
  if ( _.has(config, ['locations', env]) ) {
    return config.locations[env]
  } else if ( _.has(config, ['locations', 'default']) ) {
    return config.locations.default
  } else {
    return defaultFilePath
  }
}

exports.readManifest = function(env) {
  var filePath = getFilePath(env)
  if (useS3(filePath)) {
    //use s3
    return s3.readManifest(filePath)
  } else {
    //use local file
    return fs.readManifest(filePath)
  }
}

exports.writeManifest = function(data, env) {
  var filePath = getFilePath(env)
  if (useS3(filePath)) {
    //use s3
    return s3.writeManifest(filePath, data)
  } else {
    //use local file
    return fs.writeManifest(filePath, data)
  }
}

function useS3(filePath) {
  return filePath.startsWith('spaces://') || filePath.startsWith('s3://')
}