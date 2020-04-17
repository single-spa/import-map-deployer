const util = require("util");
const request = require("request");
const requestAsPromise = util.promisify(request);
const config = require("./config.js").config;

exports.verifyValidUrl = async function (url) {
  if (!config.skipValidUrlCheck) {
    try {
      const resp = await requestAsPromise({ url, strictSSL: false });
      if (resp.statusCode < 200 || resp.statusCode >= 400) {
        throw Error(resp.statusCode);
      }
      return true;
    } catch (err) {
      throw Error(
        `The following url in the request body is not reachable: ${url}`
      );
    }
  } else {
    return true;
  }
};
