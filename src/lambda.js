"use strict";
const awsServerlessExpress = require(process.env.NODE_ENV === "test"
  ? "aws-serverless-express/src/index"
  : "aws-serverless-express");
const { app } = require("./web-server");

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below, then redeploy (`npm run package-deploy`)
const binaryMimeTypes = [
  "application/javascript",
  "application/json",
  "application/octet-stream",
  "application/xml",
  "font/eot",
  "font/opentype",
  "font/otf",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "text/comma-separated-values",
  "text/css",
  "text/html",
  "text/javascript",
  "text/plain",
  "text/text",
  "text/xml",
];
const server = awsServerlessExpress.createServer(
  app,
  function () {
    console.log("Listening at http://localhost:%s", server.address().port);
  },
  binaryMimeTypes
);

exports.handler = (event, context) =>
  awsServerlessExpress.proxy(server, event, context);
