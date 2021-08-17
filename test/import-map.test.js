const request = require("supertest");
const { app, setConfig } = require("../src/web-server");
const {
  resetManifest: resetMemoryManifest,
} = require("../src/io-methods/memory");

describe(`/import-map.json`, () => {
  let errorSpy;
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
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    errorSpy.mockClear();
  });

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
    const response = await request(app)
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

    expect(response.body.imports).toMatchObject({
      moment: "/node_modules/moment/src/moment.js",
      "moment/": "/node_modules/moment/src/",
      lodash: "/node_modules/lodash-es/lodash.js",
      "lodash/": "/node_modules/lodash-es/",
    });
  });

  it(`does patch the service`, async () => {
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

    expect(response.body.imports).toMatchObject({
      a: "/a-1-updated.mjs",
    });
  });

  it(`does add trailing slash package`, async () => {
    const response = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        service: "my-service",
        url: "/my-service/fs6d7897dsf9/js/main/my-service.js",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.imports).toMatchObject({
      "my-service": "/my-service/fs6d7897dsf9/js/main/my-service.js",
      "my-service/": "/my-service/fs6d7897dsf9/js/main/",
    });

    const responseWithPackageDirLevel = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
        packageDirLevel: 2,
      })
      .set("accept", "json")
      .send({
        service: "my-service",
        url: "http://example.com/my-service/fs6d7897dsf9/js/main/my-service.js",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(responseWithPackageDirLevel.body.imports).toMatchObject({
      "my-service":
        "http://example.com/my-service/fs6d7897dsf9/js/main/my-service.js",
      "my-service/": "http://example.com/my-service/fs6d7897dsf9/js/",
    });

    const responseWithPackageDirLevelUrl = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
        packageDirLevel: 2,
      })
      .set("accept", "json")
      .send({
        service: "my-service",
        url: "http://example.com/my-service/fs6d7897dsf9/js/main/my-service.js",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(responseWithPackageDirLevelUrl.body.imports).toMatchObject({
      "my-service":
        "http://example.com/my-service/fs6d7897dsf9/js/main/my-service.js",
      "my-service/": "http://example.com/my-service/fs6d7897dsf9/js/",
    });
  });

  it(`does delete a service`, async () => {
    let response = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        service: "b",
        url: "http://example.com/my-service/fs6d7897dsf9/js/main/my-service.js",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.imports.b).toBeDefined();
    expect(response.body.imports["b/"]).toBeDefined();

    response = await request(app)
      .delete("/services/b")
      .set("accept", "json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.imports.b).not.toBeDefined();
    expect(response.body.imports["b/"]).not.toBeDefined();
  });

  it(`returns a 404 when you try to retrieve an import map for an environment that doesn't exist`, async () => {
    await request(app)
      .get("/import-map.json")
      .query({
        env: "envThatDoesntExist",
      })
      .expect(404);
  });

  it(`returns a 404 when you attempt to patch an import map environment that doesn't exist`, async () => {
    const response = await request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
        env: "envThatDoesntExist",
      })
      .set("accept", "json")
      .send({
        imports: {
          a: "/a-1.mjs",
        },
      })
      .expect(404);
  });

  it(`returns a 404 when you attempt to patch a service for an environment that doesn't exist`, async () => {
    await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
        env: "envThatDoesntExist",
      })
      .set("accept", "json")
      .send({
        service: "a",
        url: "/a-1-updated.mjs",
      })
      .expect(404);
  });

  it(`returns a 404 when you attempt to delete a service for an environment that doesn't exist`, async () => {
    await request(app)
      .delete("/services/b")
      .query({
        env: "envThatDoesntExist",
      })
      .set("accept", "json")
      .expect(404);
  });

  it(`returns a 400 when you attempt to patch the import map with an invalid name`, async () => {
    await request(app)
      .patch("/import-map.json")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        imports: {
          "": "/something.js",
        },
      })
      .expect(400);
  });

  it(`returns a 400 when you attempt to patch a service with an invalid name`, async () => {
    await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        service: "",
        url: "/a-1-updated.mjs",
      })
      .expect(400);
  });
});
