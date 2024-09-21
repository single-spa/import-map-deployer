module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    // Latest version of @azure/storage-blob isn't compatible with jest-runtime's implementation
    "@azure/storage-blob": "<rootDir>/__mocks__/azureStorage.js",
  },
};
