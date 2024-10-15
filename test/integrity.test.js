const request = require("supertest");
const { app, setConfig } = require("../src/web-server");
const {
  resetManifest: resetMemoryManifest,
} = require("../src/io-methods/memory");

describe(`integrity`, () => {
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
    resetMemoryManifest();
  });

  it(`sets integrity field in import map`, async () => {
    const url = "/a.js";
    const integrity = "sha256-example";

    const response = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        service: "a",
        url,
        integrity,
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.integrity).toMatchObject({
      [url]: integrity,
    });
  });

  it(`removes old integrity when patching a service`, async () => {
    const url = "/a.js";
    const integrity = "sha256-a";

    const response = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        service: "a",
        url,
        integrity,
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.integrity[url]).not.toBeUndefined();

    const url2 = "/a2.js";
    const integrity2 = "sha256-a2";

    const response2 = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        service: "a",
        url: url2,
        integrity: integrity2,
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response2.body.integrity[url]).toBeUndefined();
    expect(response2.body.integrity[url2]).not.toBeUndefined();
  });

  it(`deletes old integrity when deleting a service`, async () => {
    const url = "/a.js";
    const integrity = "sha256-example";

    const response = await request(app)
      .patch("/services")
      .query({
        skip_url_check: true,
      })
      .set("accept", "json")
      .send({
        service: "a",
        url,
        integrity,
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.integrity).toMatchObject({
      [url]: integrity,
    });

    const response2 = await request(app)
      .delete("/services/a")
      .set("accept", "json")
      .send()
      .expect(200)
      .expect("Content-Type", /json/);
    expect(response2.body.integrity[url]).toBeUndefined();
  });
});
