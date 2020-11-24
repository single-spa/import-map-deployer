module.exports = {
  manifestFormat: "importmap",
  locations: {
    dev: {
      azureContainer: "importmap",
      azureBlob: "importmap.json",
      azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING_DEV,
      azureAccount: process.env.AZURE_STORAGE_ACCOUNT_DEV,
      azureAccessKey: process.env.AZURE_STORAGE_ACCESS_KEY_DEV,
    },
  },
  username: process.env.API_USERNAME,
  password: process.env.API_PASSWORD,
};
