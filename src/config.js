'use strict'
const argv = require('minimist')(process.argv.slice(2))

if (argv._.length > 1)
  throw new Error(`sofe-deplanifester expects only a single argument, which is the configuration file`)

let config
if (argv._.length === 1) {
  config = require(argv._[0])
}

exports.config = config
