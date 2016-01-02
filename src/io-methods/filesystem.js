'use strict';
const fs = require('fs');

let filePath;

exports.setFilePath = function(location) {
  filePath = location;
}

exports.readManifest = function() {
  return new Promise((resolve, reject) => {
    //create file if not already created
    fs.open(filePath, 'a', function(err, fd) {
      if (err)
        reject(`Could not open file ${filePath}`);
      else {
        fs.readFile(filePath, 'utf8', function(err2, data) {
          if (err2) {
            console.error(err2);
            reject(`Could not read file ${filePath}`);
          }
          else
            resolve(data);
        });
      }
    });
  });
}

exports.writeManifest = function(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, function(err) {
      if (err)
        reject(`Could not write file ${filePath}`);
      else
        resolve();
    });
  });
}
