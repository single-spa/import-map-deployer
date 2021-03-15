const { getConfig } = require("./config");

exports.getCacheControl = (hostSpecificCacheControl) => {
  const config = getConfig();
  if (config.cacheControl) {
    return config.cacheControl;
  }
  return hostSpecificCacheControl || "public, must-revalidate, max-age=0";
};
