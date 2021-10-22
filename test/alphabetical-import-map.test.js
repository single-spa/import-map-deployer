const request = require("supertest");
const { app, setConfig } = require("../src/web-server");
const {
  resetManifest: resetMemoryManifest,
} = require("../src/io-methods/memory");
const { sortObjectAlphabeticallyByKeys } = require("../src/modify.js");

describe(`alphabetically sorted`, () => {
  beforeAll(() => {
    setConfig({
      manifestFormat: "importmap",
      alphabetical: true,
      packagesViaTrailingSlashes: true,
      locations: {
        prod: "memory://prod",
      },
    });
  });

  beforeEach(() => {
    // assure we have a clean import map every test
    resetMemoryManifest();
    const setupRequest = request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        imports: {
          c: "/c-1.mjs",
          b: "/b-1.mjs",
        },
      })
      .expect(200)
      .expect("Content-Type", /json/);
    return setupRequest.then((response) => {
      expect(JSON.stringify(response.body)).toBe(
        `{"imports":{"b":"/b-1.mjs","c":"/c-1.mjs"},"scopes":{}}`
      );
    });
  });

  it(`should place the import into the map alphabetically instead of just at the end`, async () => {
    const response = await request(app)
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

    expect(JSON.stringify(response.body.imports)).toBe(
      `{"a":"/a-1-updated.mjs","b":"/b-1.mjs","c":"/c-1.mjs"}`
    );
  });

  it("should return undefined or null if you pass them in and not throw an error", () => {
    expect(sortObjectAlphabeticallyByKeys(undefined)).toBe(undefined);
    expect(sortObjectAlphabeticallyByKeys(null)).toBe(null);
    expect(JSON.stringify(sortObjectAlphabeticallyByKeys({}))).toBe("{}");
  });
});

describe(`not alphabetically sorted`, () => {
  beforeAll(() => {
    setConfig({
      manifestFormat: "importmap",
      packagesViaTrailingSlashes: true,
      locations: {
        prod: "memory://prod",
      },
    });
  });

  beforeEach(() => {
    // assure we have a clean import map every test
    resetMemoryManifest();
    const setupRequest = request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        imports: {
          c: "/c-1.mjs",
          b: "/b-1.mjs",
        },
      })
      .expect(200)
      .expect("Content-Type", /json/);
    return setupRequest.then((response) => {
      expect(JSON.stringify(response.body)).toBe(
        `{"imports":{"c":"/c-1.mjs","b":"/b-1.mjs"},"scopes":{}}`
      );
    });
  });

  it(`should not place things alphabetically and should just append to the end`, async () => {
    const response = await request(app)
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

    expect(JSON.stringify(response.body.imports)).toBe(
      `{"c":"/c-1.mjs","b":"/b-1.mjs","a":"/a-1-updated.mjs"}`
    );
  });
});
