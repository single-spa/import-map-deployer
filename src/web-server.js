//Setup
'use strict';

const express = require('express')
    , bodyParser = require('body-parser')
    , app = express()
    , ioOperations = require('./io-operations.js')
    , modify = require('./modify.js')
    , healthCheck = require('./health-check.js')

healthCheck.runCheck()
.catch((ex) => {
  console.error(ex);
  console.error('Killing web server because initial health check failed');
  process.exit(1);
});

app.set('etag', false);
app.use(bodyParser.json());

// --------- //
// ENDPOINTS //
// --------- //
app.get('/', function(req, res) {
  res.send(`try doing a GET on /sofe-manifest, a PATCH on /services, or a DELETE on /services/:serviceName`);
});

app.get('/sofe-manifest.json', function(req, res) {
  ioOperations.readManifest()
  .then((data) => {
    var json = JSON.parse(data);
    res.send(json);
  })
  .catch((ex) => {
    console.error(ex);
    res.status(500).send(`Could not read manifest file -- ${ex.toString()}`);
  });
});

app.patch('/services', function(req, res) {
  var service, url;
  if ( req.body != undefined && req.body.hasOwnProperty('service') ) {
    service = req.body.service;
  } else {
    res.status(400).send('service key is missing');
  }
  if ( req.body != undefined && req.body.hasOwnProperty('url') ) {
    url = req.body.url;
  } else {
    res.status(400).send('url key is missing');
  }
  modify.modifyService(service, url)
  .then((json) => {
    res.send(json);
  })
  .catch((ex) => {
    console.error(ex);
    res.status(500).send(`Could not write manifest file -- ${ex.toString()}`);
  });
});

app.delete('/services/:serviceName', function(req, res) {
  var json = modify.modifyService(req.params.serviceName, null, true);
  res.send(json);
});

var server = app.listen(5000, function () {
  var port = server.address().port;

  console.log('Listening at http://localhost:%s', port);
});

exports.close = server.close;
