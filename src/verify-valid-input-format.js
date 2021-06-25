exports.verifyInputFormatForScopes = function (scopes) {
  const errorsToReport = [];

  if (typeof scopes !== "object") {
    errorsToReport.push(
      `Invalid import map in request body -- scopes is not an object`
    );
  } else {
    for (let scopeName in scopes) {
      if (typeof scopes[scopeName] !== "object") {
        errorsToReport.push(
          `Invalid import map in request body -- scope with name '${scopeName}' is not an object`
        );
      } else {
        if (Object.keys(scopes[scopeName]).length === 0) {
          errorsToReport.push(
            `Invalid import map in request body -- scope with name '${scopeName}' is an object with no properties`
          );
        }
      }
    }
  }

  return errorsToReport;
};

exports.verifyInputFormatForServices = function (services) {
  const errorsToReport = [];

  for (let moduleName in services) {
    if (typeof services[moduleName] !== "string") {
      errorsToReport.push(
        `Invalid import map in request body -- module with name '${moduleName}' does not have a string url`
      );
    } else if (!moduleName || moduleName.trim().length === 0) {
      // catch times where the name evaluates to false, such as "".
      errorsToReport.push(
        `Invalid module name -- module name '${moduleName}' is invalid`
      );
    } else {
      if (moduleName.endsWith("/") && !services[moduleName].endsWith("/")) {
        errorsToReport.push(
          `Invalid import map in request body -- the URL for module with name '${moduleName}' does not end with a trailing slash`
        );
      }
    }
  }

  return errorsToReport;
};
