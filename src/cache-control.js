const { config } = require("./config");

exports.cacheControl =
  config.cacheControl || "public, must-revalidate, max-age=0";
