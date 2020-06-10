const request = require("supertest");
const { app, setConfig } = require("../src/web-server");

describe(`health check`, () => {
  it(`works when http auth is not enabled`, async () => {
    setConfig({
      manifestFormat: "importmap",
      locations: {
        prod: "memory://prod",
      },
    });

    const healthResponse = await request(app)
      .get("/health")
      .expect(200)
      .expect("Content-Type", /json/);
    expect(healthResponse.body.message).toBe("import-map-deployer is running");

    const slashResponse = await request(app)
      .get("/")
      .expect(200)
      .expect("Content-Type", /json/);
    expect(slashResponse.body.message).toBe("import-map-deployer is running");
  });

  it(`does not require username and password for health check endpoints when HTTP auth is enabled`, async () => {
    setConfig({
      manifestFormat: "importmap",
      username: "username",
      password: "password",
      locations: {
        prod: "memory://prod",
      },
    });

    const healthResponse = await request(app)
      .get("/health")
      .expect(200)
      .expect("Content-Type", /json/);
    expect(healthResponse.body.message).toBe("import-map-deployer is running");

    const slashResponse = await request(app)
      .get("/")
      .expect(200)
      .expect("Content-Type", /json/);
    expect(slashResponse.body.message).toBe("import-map-deployer is running");
  });
});
