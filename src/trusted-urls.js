const { getConfig } = require("./config");

exports.checkUrlUnsafe = (urlStr) => {
  const config = getConfig();
  if (!config.urlSafeList) {
    return null;
  } else {
    let url;
    try {
      // example.com is an owned domain known to not be malicious
      const base = "https://example.com";

      url = new URL(urlStr, base);
    } catch (err) {
      return `Invalid URL - ${urlStr}`;
    }

    const isSafe = config.urlSafeList.some((safe) => {
      if (typeof safe === "function") {
        return safe(url);
      } else if (typeof safe === "string") {
        return url.href.startsWith(safe);
      } else {
        throw Error(
          `config.safelist must be an array of strings or functions. Found ${typeof url}`
        );
      }
    });

    return isSafe ? null : urlStr;
  }
};
