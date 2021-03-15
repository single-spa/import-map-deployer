"use strict";
const _ = require("lodash");
const filesystem = require("./filesystem");
const s3 = require("./s3");
const azure = require("./azure");
const google = require("./google-cloud-storage");
const { getConfig } = require("../config");
const memory = require("./memory");

function getFilePath(env) {
  const config = getConfig();
  if (_.has(config, ["locations", env])) {
    return config.locations[env];
  } else if (_.has(config, ["locations", "default"])) {
    return config.locations.default;
  } else if (!env && !_.isEmpty(config.locations)) {
    return config.locations[Object.keys(config.locations)[0]];
  } else {
    throw Error(`No such environment '${env}'. Check your configuration file.`);
  }
}

exports.readManifest = async function (env) {
  var filePath = getFilePath(env);
  if (usesAzure(filePath)) {
    //uses azure
    return azure.readManifest(filePath);
  } else if (usesGoogle(filePath)) {
    return google.readManifest(filePath);
  } else if (useS3(filePath)) {
    //use s3
    return s3.readManifest(filePath);
  } else if (useMemory(filePath)) {
    return memory.readManifest(filePath);
  } else {
    //use local file
    return filesystem.readManifest(filePath);
  }
};

exports.writeManifest = async function (data, env) {
  var filePath = getFilePath(env);

  if (usesAzure(filePath)) {
    //uses azure
    return azure.writeManifest(filePath, data);
  } else if (usesGoogle(filePath)) {
    return google.writeManifest(filePath, data);
  } else if (useS3(filePath)) {
    //use s3
    return s3.writeManifest(filePath, data);
  } else if (useMemory(filePath)) {
    return memory.writeManifest(filePath, data);
  } else {
    //use local file
    return filesystem.writeManifest(filePath, data);
  }
};

function usesAzure(filePath) {
  return _.isObject(filePath) && filePath.azureContainer && filePath.azureBlob;
}

function useS3(filePath) {
  return filePath.startsWith("spaces://") || filePath.startsWith("s3://");
}

function usesGoogle(filePath) {
  return google.isGooglePath(filePath);
}

function useMemory(filePath) {
  return filePath.startsWith("memory://");
}
