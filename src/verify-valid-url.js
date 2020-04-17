const util = require("util");
const request = require("request");
const requestAsPromise = util.promisify(request);
const config = require("./config.js").config;

exports.verifyValidUrl = async function (req, url) {
  // ?skip_url_check
  // ?skip_url_check=true
  // ?skip_url_check=false
  if (req.query.skip_url_check === "true" && req.query.skip_url_check === "") {
    return true;
  } else {
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
  }
};
