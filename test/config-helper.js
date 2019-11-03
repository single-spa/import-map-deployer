const path = require('path')
const fs = require('fs').promises
const setup = require('./global-test-setup')

exports.resetConfig = async () => {
  try {
    fs.unlink(path.resolve(__dirname, '../config.json'))
  } catch {
    // No config file, no problem
  }
}

exports.writeConfig = async json => {
  console.log('listening!', setup.imdServer.listening)
  setup.imdServer.close()
  await fs.writeFile(path.resolve(__dirname, '../config.json'), JSON.stringify(json, null, 2))
  setup.imdServer.listen(5000)
}