"use strict";
const fs = require("fs/promises");
const { getConfig } = require("../config");
const jsHelpers = require("./js-file-helpers.js");

exports.readManifest = function (filePath) {
  return fs.readFile(filePath, "utf-8");
};

exports.writeManifest = function (filePath, data) {
  const config = getConfig();
  const useJsHelpers = config && config.writeJsFile;
  const finalFilePath = useJsHelpers ? jsHelpers.getJsPath(filePath) : filePath;
  const finalData = useJsHelpers ? jsHelpers.createJsString(data) : data;

  return fs.writeFile(finalFilePath, finalData, "utf-8");
};
