const azure = require("azure-storage");
const blobService = azure.createBlobService();

exports.readManifest = function(target) {
  return new Promise(function(resolve, reject) {
    blobService.getBlobToText(target.azureContainer, target.azureBlob, function(
      error,
      response
    ) {
      if (error) reject(error);
      resolve(response);
    });
  });
};

exports.writeManifest = function(target, content) {
  return new Promise(function(resolve, reject) {
    blobService.createBlockBlobFromText(
      target.azureContainer,
      target.azureBlob,
      content,
      function(error, response) {
        if (error) reject(error);
        else resolve();
      }
    );
  });
};
