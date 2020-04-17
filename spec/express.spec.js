"use strict";
const server = require("../src/web-server.js");

describe("express app", () => {
  afterAll(() => {
    api
      .clearManifest()
      .then(() => server.close())
      .catch(() => server.close());
  });
});
