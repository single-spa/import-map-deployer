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

describe(`DELETE /scopes`, () => {
  beforeEach(async () => {
    const response = await request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        imports: {
          a: "https://cdn.com/a/3.1.1/a.js",
          b: "https://cdn.com/b/1.2.5/b.js",
          shared: "https://cdn.com/shared@22/shared.js",
        },
        scopes: {
          "/a/1.0.0/": {
            shared: "https://cdn.com/shared@11/shared.js",
          },
          "/a/2.0.0/": {
            shared: "https://cdn.com/shared@11/shared.js",
          },
          "/a/3.1.1/": {
            shared: "https://cdn.com/shared@19/shared.js",
          },
        },
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      imports: {
        a: "https://cdn.com/a/3.1.1/a.js",
        b: "https://cdn.com/b/1.2.5/b.js",
        shared: "https://cdn.com/shared@22/shared.js",
      },
      scopes: {
        "/a/1.0.0/": {
          shared: "https://cdn.com/shared@11/shared.js",
        },
        "/a/2.0.0/": {
          shared: "https://cdn.com/shared@11/shared.js",
        },
        "/a/3.1.1/": {
          shared: "https://cdn.com/shared@19/shared.js",
        },
      },
    });
  });

  it(`Returns a 400 if there is no request body`, async () => {
    await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send()
      .expect(400);
  });

  it(`Returns a 400 if the request body doesn't have a regexString key`, async () => {
    await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send({
        somethingInvalid: 123,
      })
      .expect(400);
  });

  it(`Returns a 400 if the regexString is not a string`, async () => {
    await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send({
        regexString: 123,
      })
      .expect(400);
  });

  it(`Returns a 400 if the regexString is an empty string`, async () => {
    await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send({
        regexString: "",
      })
      .expect(400);
  });

  it(`Returns a 400 if the regexString is invalid`, async () => {
    await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send({
        regexString: "something[",
      })
      .expect(400);
  });

  it(`Returns a 404 if the regex doesn't match any scopes`, async () => {
    await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send({
        regexString: "/c/[^/]+/",
      })
      .expect(404);
  });

  it(`Returns a 404 if the provided env doesn't exist`, async () => {
    await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .query({ env: "envDoesNotExist" })
      .send({
        regexString: "/c/[^/]+/",
      })
      .expect(404);
  });

  it(`Returns an empty object if using the dry_run flag and the regex doesn't match any scopes`, async () => {
    const response = await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .query({ dry_run: true })
      .send({
        regexString: "/c/[^/]+/",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({});
  });

  it(`Returns a map of the scopes that would be deleted when using the dry_run flag`, async () => {
    const response = await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .query({ dry_run: true })
      .send({
        // matches scopes that contain /a/{any string except "3.1.1"}/
        regexString: "/a/(?!3\\.1\\.1/)[^/]+/",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      "/a/1.0.0/": {
        shared: "https://cdn.com/shared@11/shared.js",
      },
      "/a/2.0.0/": {
        shared: "https://cdn.com/shared@11/shared.js",
      },
    });
  });

  it(`Deletes the correct scopes and returns the newly updated import-map`, async () => {
    const response = await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send({
        // matches scopes that contain /a/{any string except "3.1.1"}/
        regexString: "/a/(?!3\\.1\\.1/)[^/]+/",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      imports: {
        a: "https://cdn.com/a/3.1.1/a.js",
        b: "https://cdn.com/b/1.2.5/b.js",
        shared: "https://cdn.com/shared@22/shared.js",
      },
      scopes: {
        "/a/3.1.1/": {
          shared: "https://cdn.com/shared@19/shared.js",
        },
      },
    });
  });

  it(`Deleting scopes doesn't effect the original order of the scopes`, async () => {
    // Add some additional scopes
    await request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        scopes: {
          "/b/": {
            shared: "https://cdn.com/shared@11/shared.js",
          },
          "/c/": {
            shared: "https://cdn.com/shared@11/shared.js",
          },
          "/d/": {
            shared: "https://cdn.com/shared@19/shared.js",
          },
        },
      })
      .expect(200)
      .expect("Content-Type", /json/);
    // Delete /a/2.0.0/, inserted from the beforeEach
    await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send({
        regexString: "^/a/2.0.0/$",
      })
      .expect(200)
      .expect("Content-Type", /json/);
    // Delete /c/
    const response = await request(app)
      .delete("/scopes")
      .set("accept", "json")
      .send({
        regexString: "^/c/$",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    const actualScopeKeys = Object.keys(response.body.scopes);
    const expectedScopeKeys = ["/a/1.0.0/", "/a/3.1.1/", "/b/", "/d/"];

    expect(actualScopeKeys).toEqual(expectedScopeKeys);
  });
});
