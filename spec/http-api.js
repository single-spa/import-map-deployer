"use strict";
const request = require("superagent");
const fs = require("fs");

exports.getManifest = () => {
  return new Promise((resolve, reject) => {
    request.get("http://localhost:5000/sofe-manifest.json").end((err, res) => {
      if (err || !res.ok) reject(err);
      else resolve(res.body);
    });
  });
};

exports.clearManifest = () => {
  return new Promise((resolve, reject) => {
    const filename = "sofe-manifest.json";
    fs.stat(filename, (err, stats) => {
      if (err) reject();
      else {
        fs.unlink(filename, (ex) => {
          if (ex) reject();
          else resolve();
        });
      }
    });
  });
};

exports.patchService = (serviceName, url) => {
  return new Promise((resolve, reject) => {
    request("PATCH", `http://localhost:5000/services`)
      .send({
        service: serviceName,
        url: url,
      })
      .end((err, res) => {
        if (err || !res.ok) reject(err);
        else resolve(res.body);
      });
  });
};

exports.deleteService = (serviceName) => {
  return new Promise((resolve, reject) => {
    request("DELETE", `http://localhost:5000/services/${serviceName}`).end(
      (err, res) => {
        if (err || !res.ok) reject(err);
        else resolve(res.body);
      }
    );
  });
};

exports.getEnvironments = () => {
  return new Promise((resolve, reject) => {
    request("GET", `http://localhost:5000/environments`).end((err, res) => {
      if (err || !res.ok) reject(err);
      else resolve(res.body);
    });
  });
};
