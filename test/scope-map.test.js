const request = require("supertest");
const { app, setConfig } = require("../src/web-server");
// const { resetManifest } = require("../src/io-methods/memory");
beforeAll(() => {
  setConfig({
    manifestFormat: "importmap",
    username: "username",
    password: "password",
    locations: {
      prod: "memory://prod",
    },
  });
  // resetManifest();
});

afterAll(() => {
  // resetManifest();
});

describe(`/import-map.json - Scopes`, () => {
  it(`does not return anything when it's not setup yet.`, async () => {
    const healthResponse = await request(app)
      .get("/import-map.json")
      .expect(200)
      .expect("Content-Type", /json/);

    // we did not setup yet
    expect(healthResponse.body.message).toBe(undefined);
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

    // we did not setup yet
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

  it(`The data is still in there`, async () => {
    const healthResponse = await request(app)
      .get("/import-map.json")
      .expect(200)
      .expect("Content-Type", /json/);

    // we did not setup yet
    expect(healthResponse.body).toMatchObject({
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
