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

describe(`/import-map.json - Scopes`, () => {
  it(`does return empty import-map when it's not setup yet.`, async () => {
    const response = await request(app)
      .get("/import-map.json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({ imports: {}, scopes: {} });
  });

  it(`does accept a scopes-only patch`, async () => {
    const response = await request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        scopes: {
          "https://cdn.com/scope2/": {
            a: "https://cdn.com/a-2.mjs",
          },
          "https://cdn.com/scope2/scope3/": {
            b: "https://cdn.com/b-3.mjs",
          },
        },
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      imports: {},
      scopes: {
        "https://cdn.com/scope2/": {
          a: "https://cdn.com/a-2.mjs",
        },
        "https://cdn.com/scope2/scope3/": {
          b: "https://cdn.com/b-3.mjs",
        },
      },
    });
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
          a: "https://cdn.com/a-1.mjs",
          b: "https://cdn.com/b-1.mjs",
          c: "https://cdn.com/c-1.mjs",
        },
        scopes: {
          "https://cdn.com/scope2/": {
            a: "https://cdn.com/a-2.mjs",
          },
          "https://cdn.com/scope2/scope3/": {
            b: "https://cdn.com/b-3.mjs",
          },
        },
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      imports: {
        a: "https://cdn.com/a-1.mjs",
        b: "https://cdn.com/b-1.mjs",
        c: "https://cdn.com/c-1.mjs",
      },
      scopes: {
        "https://cdn.com/scope2/": {
          a: "https://cdn.com/a-2.mjs",
        },
        "https://cdn.com/scope2/scope3/": {
          b: "https://cdn.com/b-3.mjs",
        },
      },
    });
  });
});
