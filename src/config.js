"use strict";
const fs = require("fs"),
  path = require("path"),
  argv = require("minimist")(process.argv.slice(2));

if (argv._.length > 1)
  throw new Error(
    `sofe-deplanifester expects only a single argument, which is the configuration file`
  );

let config = {};
if (argv._.length === 1) {
  config = require(path.join(process.cwd(), argv._[0]));
}

if (argv._.length === 0) {
  //see if the default config.json exists
  if (fs.existsSync(path.resolve(__dirname, "../config.json"))) {
    config = require("../config.json");
  }
}

exports.setConfig = (newConfig) => (config = newConfig);
exports.getConfig = () => config;
