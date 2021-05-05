"use strict";

const aws = require("aws-sdk"),
  getConfig = require("../config").getConfig,
  jsHelpers = require("./js-file-helpers.js");

if (getConfig() && getConfig().region) {
  aws.config.update({ region: getConfig().region });
}
const { getCacheControl } = require("../cache-control");
const { getEmptyManifest } = require("../modify");

function parseFilePath(filePath) {
  const prefix = isDigitalOcean(filePath) ? "spaces://" : "s3://";
  const file = filePath.split(prefix)[1];
  const bucketDelimiter = isDigitalOcean(filePath) ? "." : "/";
  const bucket = file.substr(0, file.indexOf(bucketDelimiter));
  const key = file.substr(file.indexOf("/") + 1);

  return {
    bucket,
    key,
  };
}

let s3PutObjectCacheControl;
let s3PutObjectConfigSansCacheControl = {};
if (getConfig() && getConfig().s3 && getConfig().s3.putObject) {
  const { CacheControl, ...rest } = getConfig().s3.putObject;
  s3PutObjectCacheControl = CacheControl;
  s3PutObjectConfigSansCacheControl = { ...rest };
}

const cacheControl = getCacheControl(s3PutObjectCacheControl);

const s3 = new aws.S3({
  endpoint: getConfig().s3Endpoint,
});

exports.readManifest = async function (filePath) {
  let file = parseFilePath(filePath);
  const objectMetadata = {
    Bucket: file.bucket,
    Key: file.key,
  };

  try {
    const data = await s3.getObject(objectMetadata).promise();

    return data.Body.toString();
  } catch (err) {
    if (err.code === "NoSuchKey") {
      console.log(
        `No import map found in bucket ${file.bucket}/${file.key} - creating an empty one for you.`
      );
      await exports.writeManifest(filePath, JSON.stringify(getEmptyManifest()));
      const data = await s3.getObject(objectMetadata).promise();

      return data.Body.toString();
    }
  }
};

exports.writeManifest = function (filePath, data) {
  const config = getConfig();
  const jsonPromise = new Promise(function (resolve, reject) {
    const file = parseFilePath(filePath);
    s3.putObject(
      {
        Bucket: file.bucket,
        Key: file.key,
        Body: data,
        CacheControl: cacheControl,
        ContentType: "application/importmap+json",
        ACL: "public-read",
        ...s3PutObjectConfigSansCacheControl,
      },
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  const jsPromise = new Promise(function (resolve, reject) {
    if (!config || !config.writeJsFile) {
      resolve();
    } else {
      const file = parseFilePath(filePath);
      const jsKey = jsHelpers.getJsPath(file.key);

      s3.putObject(
        {
          Bucket: file.bucket,
          Key: jsKey,
          Body: jsHelpers.createJsString(data),
          CacheControl: cacheControl,
          ContentType: "application/importmap+json",
          ACL: "public-read",
          ...s3PutObjectConfigSansCacheControl,
        },
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    }
  });
  return Promise.all([jsonPromise, jsPromise]);
};

function isDigitalOcean(filePath) {
  return filePath.startsWith("spaces://");
}
