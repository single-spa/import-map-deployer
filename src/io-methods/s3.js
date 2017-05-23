'use strict'

const aws = require('aws-sdk'),
  config = require('../config').config,
  jsHelpers = require('./js-file-helpers.js')

if ( config) {
  aws.config.update({'region': config.region})
}

function parseFilePath(filePath) {
  let file = filePath.split('s3://')[1]
  let bucket = file.substr(0, file.indexOf('/'))
  let key = file.substr(file.indexOf('/') + 1)
  return {
    bucket: bucket,
    key: key
  }
}

const s3 = new aws.S3()
exports.readManifest = function(filePath) {
  return new Promise(function(resolve, reject) {
    let file = parseFilePath(filePath)
    s3.getObject({Bucket: file.bucket, Key: file.key}, function(err, data) {
      if (err)
        reject(err)
      resolve(data.Body.toString())
    })
  })
}

exports.writeManifest = function(filePath, data) {
  const jsonPromise = new Promise(function(resolve, reject) {
    const file = parseFilePath(filePath)
    s3.putObject({
        Bucket: file.bucket,
        Key: file.key,
        Body: data,
        ContentType: 'application/json',
        CacheControl: 'public, must-revalidate, max-age=0'
    }, function(err) {
      if (err)
        reject(err)
      else
        resolve()
    })
  })

  const jsPromise = new Promise(function(resolve, reject) {
    if (!config || !config.writeJsFile) {
      resolve();
    } else {
      const file = parseFilePath(filePath)
      const jsKey = jsHelpers.getJsPath(file.key);

      s3.putObject({
        Bucket: file.bucket,
        Key: jsKey,
        Body: jsHelpers.createJsString(data),
        ContentType: 'application/json',
        CacheControl: 'public, must-revalidate, max-age=0'
      }, function(err) {
        if (err)
          reject(err)
        else
          resolve()
      })
    }
  })

  return Promise.all([jsonPromise, jsPromise])
}
