const { Storage } = require("@google-cloud/storage");

const storage = new Storage();

const regex = /^google:\/\/(.+)\/(.+)$/;

function parseFilePath(filePath) {
  const [_, bucketName, fileName] = regex.exec(filePath);
  if (!bucketName || !fileName) {
    throw Error(`Invalid Google Cloud Storage url: ${filePath}`);
  }
  return { bucketName, fileName };
}

exports.readManifest = function (filePath) {
  return Promise.resolve().then(() => {
    const { bucketName, fileName } = parseFilePath(filePath);
    return storage
      .bucket(bucketName)
      .file(fileName)
      .download()
      .then((data) => data.toString("utf-8"));
  });
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
          cacheControl: "public, must-revalidate, max-age=0",
        },
      });
  });
};
