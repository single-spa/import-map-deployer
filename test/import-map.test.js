const request = require("supertest");
const { app, setConfig } = require("../src/web-server");
const {
  resetManifest: resetMemoryManifest,
} = require("../src/io-methods/memory");

beforeAll(() => {
  setConfig({
    manifestFormat: "importmap",
    locations: {
      prod: "memory://prod",
    },
  });
});

beforeEach(() => {
  // assure we have a clean import map every test
  resetMemoryManifest();
});

describe(`/import-map.json`, () => {
  it(`does not return anything when it's not setup yet.`, async () => {
    const response = await request(app)
      .get("/import-map.json")
      .expect(200)
      .expect("Content-Type", /json/);

    // we did not setup yet, so expect an empty import-map.
    expect(response.body).toMatchObject({ imports: {}, scopes: {} });
  });

  it(`does give back the same items after first patch`, async () => {
    const response = await request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        imports: {
          a: "/a-1.mjs",
          b: "/b-1.mjs",
          c: "/c-1.mjs",
        },
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      imports: {
        a: "/a-1.mjs",
        b: "/b-1.mjs",
        c: "/c-1.mjs",
      },
      scopes: {},
    });
  });

  it(`does support services with trailing slashes`, async () => {
    const healthResponse = await request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        imports: {
          moment: "/node_modules/moment/src/moment.js",
          "moment/": "/node_modules/moment/src/",
          lodash: "/node_modules/lodash-es/lodash.js",
          "lodash/": "/node_modules/lodash-es/",
        },
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(healthResponse.body.imports).toMatchObject({
      moment: "/node_modules/moment/src/moment.js",
      "moment/": "/node_modules/moment/src/",
      lodash: "/node_modules/lodash-es/lodash.js",
      "lodash/": "/node_modules/lodash-es/",
    });
  });

  it(`does patch the service`, async () => {
    const healthResponse = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        service: "a",
        url: "/a-1-updated.mjs",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(healthResponse.body.imports).toMatchObject({
      a: "/a-1-updated.mjs",
    });
  });

  it(`does delete a service`, async () => {
    const healthResponse = await request(app)
      .delete("/services/b")
      .set("accept", "json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(healthResponse.body.imports.b).toBe(undefined);
  });
});
