const { BlobServiceClient } = require("@azure/storage-blob");
let blobService;

const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;

async function getBlobService() {
  blobService =
    blobService ||
    (await BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    ));
  return blobService;
}

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

// Reference: https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/storage/storage-blob#download-a-blob-and-convert-it-to-a-string-nodejs
exports.readManifest = async function (target) {
  const blobService = await getBlobService();
  const containerClient = blobService.getContainerClient(target.azureContainer);
  const blobClient = containerClient.getBlobClient(target.azureBlob);

  const downloadBlockBlobResponse = await blobClient.download();
  const response = await streamToString(
    downloadBlockBlobResponse.readableStreamBody
  );
  return response;
};

exports.writeManifest = async function (target, content) {
  const blobService = await getBlobService();
  const containerClient = blobService.getContainerClient(target.azureContainer);
  const blockBlobClient = containerClient.getBlockBlobClient(target.azureBlob);
  return await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: {
      blobCacheControl: "public, must-revalidate, max-age=0",
      blobContentType: "application/importmap+json",
    },
  });
};
