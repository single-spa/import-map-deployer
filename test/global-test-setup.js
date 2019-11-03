const path = require('path')
const fs = require('fs').promises
const nodeStatic = require('node-static');
const http = require('http')

const file = new nodeStatic.Server(path.resolve(__dirname, './mockServices'));
const staticServer = http.createServer(function (request, response) {
  request.addListener('end', function() {
    file.serve(request, response);
  }).resume();
})

module.exports = setup
setup.staticServer = staticServer
setup.imdServer = require('../src/web-server').server

async function setup() {
  const sofeManifestPath = path.resolve(__dirname, '../sofe-manifest.json')
  let sofeManifestExists
  try {
    await fs.access(sofeManifestPath)
    sofeManifestExists = true
  } catch {
    sofeManifestExists = false
  }

  if (sofeManifestExists) {
    await fs.unlink(sofeManifestPath)
  }

  if (!setup.imdServer.listening) {
    setup.imdServer.listen(5000)
  }
  staticServer.listen(7654);
}

global.resetConfig = () => global.writeConfig('')

global.writeConfig = async json => {
  setup.imdServer.close()
  await fs.writeFile(path.resolve(__dirname, '../config.json'), JSON.stringify(json, null, 2))
  setup.imdServer.listen(5000)
}