const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

const { getCacheControl } = require("../cache-control");
const { getEmptyManifest } = require("../modify");

async function createBlobService(target) {
  const connectionString =
    target.azureConnectionString || process.env.AZURE_STORAGE_CONNECTION_STRING;
  const account = target.azureAccount || process.env.AZURE_STORAGE_ACCOUNT;
  const accessKey =
    target.azureAccessKey || process.env.AZURE_STORAGE_ACCESS_KEY;
  if (connectionString) {
    return await BlobServiceClient.fromConnectionString(connectionString);
  } else if (account && accessKey) {
    const sharedKeyCredential = new StorageSharedKeyCredential(
      account,
      accessKey
    );
    return new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential
    );
  } else {
    throw new Error(
      "Azure credentials are not correct, please provide the Azure environment variables described in https://github.com/single-spa/import-map-deployer#azure-storage"
    );
  }
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
  const blobService = await createBlobService(target);
  const containerClient = blobService.getContainerClient(target.azureContainer);
  const blobClient = containerClient.getBlobClient(target.azureBlob);
  const blobExists = await blobClient.exists(target.azureBlob);

  if (!blobExists) {
    await exports.writeManifest(target, JSON.stringify(getEmptyManifest()));
  }

  const downloadBlockBlobResponse = await blobClient.download();
  const response = await streamToString(
    downloadBlockBlobResponse.readableStreamBody
  );
  return response;
};

exports.writeManifest = async function (target, content) {
  const blobService = await createBlobService(target);
  const containerClient = blobService.getContainerClient(target.azureContainer);
  const blockBlobClient = containerClient.getBlockBlobClient(target.azureBlob);
  return await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: {
      blobCacheControl: getCacheControl(),
      blobContentType: "application/importmap+json",
    },
  });
};
