'use strict'
const _ = require('lodash')
const fs = require('fs')
const config = require('../config.js').config

var defaultFilePath = 'sofe-manifest.json'

function getFilePath(env) {
  if ( _.has(config, [env, 'location']) )
    return config[env].location
  } else if ( _.has(config, ['default', 'location']) ) {
    return config.default.location
  } else {
    return defaultFilePath
  }
}

exports.readManifest = function(env) {
  return new Promise((resolve, reject) => {
    var filePath = getFilePath(env)
    if ( _.startsWith(filePath, 's3://') ) {
      //use s3
    } else {
      //use local file
    }
    //create file if not already created
    //fs.open(filePath, 'a', function(err, fd) {
    //  if (err)
    //    reject(`Could not open file ${filePath}`)
    //  else {
    //    fs.readFile(filePath, 'utf8', function(err2, data) {
    //      if (err2) {
    //        console.error(err2)
    //        reject(`Could not read file ${filePath}`)
    //      }
    //      else
    //        resolve(data)
     //   })
     // }
    //})
  })
}

exports.writeManifest = function(data, env) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, function(err) {
      if (err)
        reject(`Could not write file ${filePath}`)
      else
        resolve()
    })
  })
}
