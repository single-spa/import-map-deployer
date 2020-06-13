exports.getJsPath = function (filePath) {
  return filePath.substring(0, filePath.lastIndexOf(".")) + ".js";
};

exports.createJsString = function (jsonManifestString) {
  return `SystemJS.config(${jsonManifestString})`;
};
