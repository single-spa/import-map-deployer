'use strict'
const _ = require('lodash')
    , fs = require('./filesystem')
    , s3 = require('./s3')
    , config = require('../config').config

const defaultFilePath = 'sofe-manifest.json'

function getFilePath(env) {
  if ( _.has(config, [env, 'location']) ) {
    return config[env].location
  } else if ( _.has(config, ['default', 'location']) ) {
    return config.default.location
  } else {
    return defaultFilePath
  }
}

exports.readManifest = function(env) {
  var filePath = getFilePath(env)
  if ( _.startsWith(filePath, 's3://') ) {
    //use s3
    return s3.readManifest(filePath)
  } else {
    //use local file
    return fs.readManifest(filePath)
  }
}

exports.writeManifest = function(data, env) {
  var filePath = getFilePath(env)
  if ( _.startsWith(filePath, 's3://') ) {
    //use s3
    return s3.readManifest(filePath)
  } else {
    //use local file
    return fs.readManifest(filePath, data)
  }
}