module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    "@azure/storage-blob": "<rootDir>/__mocks__/azureStorage.js",
  },
};
