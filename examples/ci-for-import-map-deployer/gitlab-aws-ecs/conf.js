module.exports = {
  username: process.env.HTTP_USERNAME,
  password: process.env.HTTP_PASSWORD,
  region: process.env.AWS_DEFAULT_REGION || "us-east-2",
  manifestFormat: "importmap",
  locations: {
    stage: process.env.STAGING_S3_OBJECT_URL,
    prod: process.env.PRODUCTION_S3_OBJECT_URL,
  },
};
