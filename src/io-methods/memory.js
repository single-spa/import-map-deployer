let manifests = {};

exports.readManifest = async function (filePath) {
  return manifests[filePath] || "";
};

exports.writeManifest = async function (filePath, data) {
  manifests[filePath] = data;
};

exports.resetManifest = async function () {
  manifests = {};
};
