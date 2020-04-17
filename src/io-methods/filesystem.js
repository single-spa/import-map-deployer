"use strict";
const fs = require("fs");
const config = require("../config").config;
const jsHelpers = require("./js-file-helpers.js");

exports.readManifest = function (filePath) {
  return new Promise((resolve, reject) => {
    //create file if not already created
    fs.open(filePath, "a", function (err, fd) {
      if (err) reject(`Could not open file ${filePath}`);
      else {
        fs.readFile(filePath, "utf8", function (err2, data) {
          if (err2) {
            console.error(err2);
            reject(`Could not read file ${filePath}`);
          } else resolve(data);
        });
      }
    });
  });
};

exports.writeManifest = function (filePath, data) {
  const jsonPromise = new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, function (err) {
      if (err) reject(`Could not write file ${filePath}`);
      else resolve();
    });
  });

  const jsPromise = new Promise((resolve, reject) => {
    if (!config || !config.writeJsFile) {
      resolve();
    } else {
      fs.writeFile(
        jsHelpers.getJsPath(filePath),
        jsHelpers.createJsString(data),
        function (err) {
          if (err) reject(`Could not write file ${filePath}`);
          else resolve();
        }
      );
    }
  });

  return Promise.all([jsonPromise, jsPromise]);
};
