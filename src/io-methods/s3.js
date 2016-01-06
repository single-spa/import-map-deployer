'use strict'

const aws = require('aws-sdk')
    , config = require('../config').config


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
  return new Promise(function(resolve, reject) {
    let file = parseFilePath(filePath)
    s3.putObject({Bucket: file.bucket, Key: file.key, Body:data}, function(err) {
      if (err)
        reject(err)
      resolve()
    })
  })

}
