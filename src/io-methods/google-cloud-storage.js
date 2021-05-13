const { Storage } = require("@google-cloud/storage");
const { first } = require("lodash");

const storage = new Storage();

const regex = /^(?:google|gs):\/\/(.+?)\/(.+)$/;

const { getCacheControl } = require("../cache-control");
const { getEmptyManifest } = require("../modify");

exports.isGooglePath = function (path) {
  return regex.test(path);
};

function parseFilePath(filePath) {
  const [_, bucketName, fileName] = regex.exec(filePath);
  if (!bucketName || !fileName) {
    throw Error(`Invalid Google Cloud Storage url: ${filePath}`);
  }
  return { bucketName, fileName };
}

exports.readManifest = async function (filePath) {
  const { bucketName, fileName } = parseFilePath(filePath);
  const file = await storage.bucket(bucketName).file(fileName);
  const exists = first(await file.exists());

  if (!exists) {
    await exports.writeManifest(filePath, JSON.stringify(getEmptyManifest()));
  }

  return file.download().then((data) => data.toString("utf-8"));
};

exports.writeManifest = function (filePath, data) {
  return Promise.resolve().then(() => {
    const { bucketName, fileName } = parseFilePath(filePath);
    return storage
      .bucket(bucketName)
      .file(fileName)
      .save(data, {
        contentType: "application/importmap+json",
        metadata: {
          cacheControl: getCacheControl(),
        },
      });
  });
};
