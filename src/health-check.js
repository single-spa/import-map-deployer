"use strict";
const ioOperations = require("./io-operations.js");

exports.runCheck = function () {
  return ioOperations.readManifest().then((firstManifest) => {
    return ioOperations.writeManifest(firstManifest).then(() => {
      return ioOperations.readManifest().then((secondManifest) => {
        if (firstManifest !== secondManifest) {
          throw new Error(
            `Health check failed - reading then writing the same then reading should be idempotent`
          );
        } else {
          console.log("Health check complete");
        }
      });
    });
  });
};
