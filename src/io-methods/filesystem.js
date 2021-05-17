"use strict";
const fs = require("fs/promises");
const { getConfig } = require("../config");
const { getEmptyManifest } = require("../modify");
const jsHelpers = require("./js-file-helpers.js");

exports.readManifest = async function (filePath) {
  try {
    await fs.access(filePath, fs.F_OK);

    return fs.readFile(filePath, "utf-8");
  } catch (missingFileErr) {
    await exports.writeManifest(filePath, JSON.stringify(getEmptyManifest()));

    return fs.readFile(filePath, "utf-8");
  }
};

exports.writeManifest = function (filePath, data) {
  const config = getConfig();
  const useJsHelpers = config && config.writeJsFile;
  const finalFilePath = useJsHelpers ? jsHelpers.getJsPath(filePath) : filePath;
  const finalData = useJsHelpers ? jsHelpers.createJsString(data) : data;

  return fs.writeFile(finalFilePath, finalData, "utf-8");
};
