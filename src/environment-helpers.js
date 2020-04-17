const config = require("./config.js"),
  _ = require("lodash");

exports.getEnvNames = function () {
  return config.getConfig() && config.getConfig().locations
    ? Object.keys(config.getConfig().locations)
    : [];
};

exports.getEnvLocation = function (envName) {
  return config.getConfig().locations[envName];
};
