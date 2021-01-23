const { config } = require("./config");

exports.getCacheControl = (hostSpecificCacheControl) => {
  if (config.cacheControl) {
    return config.cacheControl;
  }
  return hostSpecificCacheControl || "public, must-revalidate, max-age=0";
}
