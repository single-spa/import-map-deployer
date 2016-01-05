//Setup
'use strict'

const express = require('express')
    , bodyParser = require('body-parser')
    , app = express()
    , ioOperations = require('./io-operations.js')
    , modify = require('./modify.js')
    , healthCheck = require('./health-check.js')
    , auth = require('./auth.js')

healthCheck.runCheck()
.catch((ex) => {
  console.error(ex)
  console.error('Killing web server because initial health check failed')
  process.exit(1)
})

app.set('etag', false)
app.use(bodyParser.json())
app.use(auth)

// --------- //
// ENDPOINTS //
// --------- //
app.get('/', function(req, res) {
  res.send(`try doing a GET on /sofe-manifest, a PATCH on /services, or a DELETE on /services/:serviceName`)
})

app.get('/sofe-manifest.json', function(req, res) {
  ioOperations.readManifest()
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
  var service, url
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
  modify.modifyService(service, url)
  .then((json) => {
    res.send(json)
  })
  .catch((ex) => {
    console.error(ex)
    res.status(500).send(`Could not write manifest file -- ${ex.toString()}`)
  })
})

app.delete('/services/:serviceName', function(req, res) {
  modify.modifyService(req.params.serviceName, null, true)
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
