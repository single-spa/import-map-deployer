//Handle http basic auth
'use strict'
const io = require('./io-operations')
const auth = require('basic-auth')

let admins = {}

if ( io.username ) {
  admins[io.username] = { password: io.password }
}

module.exports = function(req, res, next) {
  if ( io.username === undefined ) {
    // not using auth
    return next()
  }
  var user = auth(req)
  if ((!user || !admins[user.name] || admins[user.name].password !== user.pass) && req.url != '/') {
    res.set('WWW-Authenticate', 'Basic realm="sofe-deplanifester"')
    return res.status(401).send()
  }
  return next()
};


