//Setup

var express = require('express')
  , bodyParser = require('body-parser')
  , app = express()
  , fs = require('fs')
  , Lock = require('rwlock')
  , lock = new Lock()

app.set('etag', false)
app.use(bodyParser.json())


// File editing
var fileName = 'sofe-manifest.json'

function modifyService(serviceName, url, remove) {
  // obtain lock (we need a global lock so deploys dont have a race condition)
  var json
  lock.writeLock(function (release) {
    // create file if not exists
    fs.openSync(fileName, 'a')
    
    // read file as json
    var data = fs.readFileSync(fileName, 'utf8')
    if ( data==='' ) {
      json = {"sofe":{"manifest":{}}};
    } else {
      json = JSON.parse(data)
    }
 
    // modify json
    if ( remove ) {
      delete json.sofe.manifest[serviceName]
    } else { 
      json.sofe.manifest[serviceName] = url
    }
    // write json to file
    var string = JSON.stringify(json, null, 2)
    fs.writeFileSync(fileName, string)
    
    // release lock
    release()
  })
  return json
}


// --------- //
// ENDPOINTS //
// --------- //
app.get('/', function(req, res) {
  res.send('hello world')
})

app.get('/sofe-manifest.json', function(req, res) {
  fs.readFile(fileName, 'utf8', function (err, data) {
    if (err) throw err;
    var json = JSON.parse(data)
    res.send(json)
  })
})

app.patch('/services', function(req, res) {
  var service
  var url 
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
  var json = modifyService(service, url)
  //console.log(req.body)
  res.send(json)
})

app.delete('/services/:serviceName', function(req, res) {
  var json = modifyService(req.params.serviceName, null, true)
  res.send(json)
})

var server = app.listen(5000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log('Listening at http://%s:%s', host, port)
})
