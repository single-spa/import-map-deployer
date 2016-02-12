//Setup
'use strict'

const express = require('express')
    , bodyParser = require('body-parser')
    , app = express()
    , ioOperations = require('./io-operations.js')
    , modify = require('./modify.js')
    , healthCheck = require('./health-check.js')
    , auth = require('./auth.js')
    , envHelpers = require('./environment-helpers.js')
    , _ = require('lodash')

healthCheck.runCheck()
.catch((ex) => {
  console.error(ex)
  console.error('Killing web server because initial health check failed')
  process.exit(1)
})

app.set('etag', false)
app.use(bodyParser.json())
app.use(auth)
app.use(express.static(__dirname + "/public"))

function getEnv(req) {
  if ( req.query.env === undefined ) {
    return 'default'
  } else {
    return req.query.env
  }
}

// --------- //
// ENDPOINTS //
// --------- //
// app.get('/', function(req, res) {
//   res.send(`try doing a GET on /sofe-manifest, a PATCH on /services, or a DELETE on /services/:serviceName`)
// })

app.get('/environments', function(req, res) {
  res.send({environments: notEmpty(envHelpers.getEnvNames()).map(toEnvObject)})

  function notEmpty(envs) {
    return envs.length > 0 ? envs : ['default']
  }

  function toEnvObject(name) {
    return {
      name: name,
      isDefault: isDefault(name),
      aliases: aliases(name),
    }
  }

  function isDefault(name) {
    return name === 'default' || envHelpers.getEnvLocation(name) === envHelpers.getEnvLocation('default')
  }

  function aliases(envName) {
    return envHelpers.getEnvNames().filter((name) => {
      return envName !== name && envHelpers.getEnvLocation(name) === envHelpers.getEnvLocation(envName);
    })
  }
})

app.get('/sofe-manifest.json', function(req, res) {
  let env = getEnv(req)
  ioOperations.readManifest(env)
  .then((data) => {
    var json = JSON.parse(data)
    res.send(json)
  })
  .catch((ex) => {
    console.error(ex)
    res.status(500).send(`Could not read manifest file -- ${ex.toString()}`)
  })
})

app.patch('/services', function(req, res) {
  let service, url
  let env = getEnv(req)
  if ( req.body != undefined && req.body.hasOwnProperty('service') ) {
    service = req.body.service
  } else {
    res.status(400).send('service key is missing')
  }
  if ( req.body != undefined && req.body.hasOwnProperty('url') ) {
    url = req.body.url
  } else {
    res.status(400).send('url key is missing')
  }
  modify.modifyService(env, service, url)
  .then((json) => {
    res.send(json)
  })
  .catch((ex) => {
    console.error(ex)
    res.status(500).send(`Could not write manifest file -- ${ex.toString()}`)
  })
})

app.delete('/services/:serviceName', function(req, res) {
  let env = getEnv(req)
  modify.modifyService(env, req.params.serviceName, null, true)
  .then((data) => {
    res.send(data)
  })
  .catch((ex) => {
    console.error(ex)
    res.status(500).send(`Could not delete service ${req.params.serviceName}`)
  })
})

var server = app.listen(5000, function () {
  console.log('Listening at http://localhost:%s', server.address().port)
})

exports.close = server.close
