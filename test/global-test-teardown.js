const setup = require('./global-test-setup')

module.exports = async function() {
  setup.imdServer.close()
  setup.staticServer.close()
}