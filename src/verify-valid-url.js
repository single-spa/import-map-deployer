const util = require("util");
const request = require("request");
const requestAsPromise = util.promisify(request);

async function verifyValidUrl(req, url) {
  if (req.query.skip_url_check === "true" || req.query.skip_url_check === "") {
    // ?skip_url_check
    // ?skip_url_check=true
    return true;
  } else {
    // ?skip_url_check=false
    // ?<no param>
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
}

exports.verifyValidUrl = verifyValidUrl;

function canVerify(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

exports.findUrlsToValidateInScopes = function (scopes) {
  const toValidateUrls = [];

  for (let scopeKey in scopes) {
    const scope = scopes[scopeKey];
    for (let specifier in scope) {
      const address = scope[specifier];

      if (canVerify(scopeKey)) {
        toValidateUrls.push(new URL(address, scopeKey).href);
      } else if (canVerify(address)) {
        toValidateUrls.push(address);
      }
    }
  }

  return toValidateUrls;
};

exports.findUrlsToValidateInServices = function (services) {
  const toValidateUrls = [];

  for (let specifier in services) {
    const address = services[specifier];

    if (canVerify(specifier)) {
      toValidateUrls.push(new URL(address, specifier).href);
    } else if (canVerify(address)) {
      toValidateUrls.push(address);
    }
  }

  return toValidateUrls;
};
