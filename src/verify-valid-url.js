async function verifyValidUrl(req, url) {
  if (req.query.skip_url_check === "true" || req.query.skip_url_check === "") {
    // ?skip_url_check
    // ?skip_url_check=true
    return true;
  } else {
    // ?skip_url_check=false
    // ?<no param>
    const r = await fetch(url);
    if (!r.ok) {
      throw Error(
        `The following url in the request body is not reachable: ${url} ${r.status} ${r.statusText}`
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

exports.findUrlsToValidateInIntegrity = function (integrity) {
  const toValidateUrls = [];

  for (let specifier in integrity) {
    const address = specifier;

    if (canVerify(specifier)) {
      toValidateUrls.push(new URL(address, specifier).href);
    } else if (canVerify(address)) {
      toValidateUrls.push(address);
    }
  }

  return toValidateUrls;
};
