"use strict";
const webServer = require("../src/web-server.js");
const nodeStatic = require("node-static");
const api = require("./http-api.js");
let configHelper = require("../src/config.js");
let config = configHelper.config;

const file = new nodeStatic.Server("./spec/mockServices");
require("http")
  .createServer(function (request, response) {
    request
      .addListener("end", function () {
        file.serve(request, response);
      })
      .resume();
  })
  .listen(7654);

console.log("Static server listening on http://localhost:7654");

describe("GET /environments", () => {
  const originalConfig = config;

  afterEach(() => (config = originalConfig));

  it("returns just the default environment if no other is specified", (done) => {
    config = {
      locations: null,
    };
    api
      .getEnvironments()
      .then((response) => {
        expect(response.environments).toEqual([
          {
            name: "default",
            isDefault: true,
            aliases: [],
          },
        ]);
        done();
      })
      .catch((ex) => fail(ex));
  });

  it("returns all the envs in the config, including default if present", (done) => {
    configHelper.setConfig({
      locations: {
        default: "1",
        prod: "1",
        stage: "2",
      },
    });
    api
      .getEnvironments()
      .then((response) => {
        expect(response.environments).toEqual([
          {
            name: "default",
            isDefault: true,
            aliases: ["prod"],
          },
          {
            name: "prod",
            isDefault: true,
            aliases: ["default"],
          },
          {
            name: "stage",
            isDefault: false,
            aliases: [],
          },
        ]);
        done();
      })
      .catch((ex) => fail(ex));
  });

  it('does not return "default" if it\'s not in the config', (done) => {
    configHelper.setConfig({
      locations: {
        prod: "1",
        stage: "2",
      },
    });
    api
      .getEnvironments()
      .then((response) => {
        expect(response.environments).toEqual([
          {
            name: "prod",
            isDefault: false,
            aliases: [],
          },
          {
            name: "stage",
            isDefault: false,
            aliases: [],
          },
        ]);
        done();
      })
      .catch((ex) => fail(ex));
  });
});
