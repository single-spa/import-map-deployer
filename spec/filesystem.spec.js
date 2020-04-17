"use strict";
const webServer = require("../src/web-server.js");
const api = require("./http-api.js");

describe("filesystem end to end tests", () => {
  beforeAll((done) => {
    api
      .clearManifest()
      .then(() => done())
      .catch(() => done());
  });

  afterEach((done) => {
    api
      .clearManifest()
      .then(() => done())
      .catch(() => done());
  });

  it("returns a valid manifest when you get the manifest", (done) => {
    api
      .getManifest()
      .then((manifest) => {
        expect(manifest).toEqual({ sofe: { manifest: {} } });
        api.clearManifest();
        done();
      })
      .catch((ex) => {
        throw ex;
      });
  });

  it(`error when patching a service with an invalid url`, (done) => {
    const serviceName = "fs-service-1";
    const url = "http://localhost:7654/noExisty.js";
    api
      .patchService(serviceName, url)
      .then(() => {
        fail("should have errored");
      })
      .catch((ex) => {
        expect(ex.response.text).toBe(
          "The url does not exist for service fs-service-1: http://localhost:7654/noExisty.js"
        );
        done();
      });
  });

  it(`can write a manifest, even if you've never written a manifest`, (done) => {
    const serviceName = "fs-service-1";
    const url = "http://localhost:7654/1.js";
    api
      .patchService(serviceName, url)
      .then(() => {
        api
          .getManifest()
          .then((result) => {
            expect(result.sofe.manifest[serviceName]).toEqual(url);
            done();
          })
          .catch((ex) => {
            fail(ex);
            done();
          });
      })
      .catch((ex) => {
        fail(ex);
        done();
      });
  });

  it("can write two things into the manifest", (done) => {
    const service2 = "fs-service-2";
    const url2 = "http://localhost:7654/2.js";
    const service3 = "fs-service-3";
    const url3 = "http://localhost:7654/3.js";

    api
      .patchService(service2, url2)
      .then(() => {
        api
          .patchService(service3, url3)
          .then((result) => {
            expect(result.sofe.manifest[service2]).toEqual(url2);
            expect(result.sofe.manifest[service3]).toEqual(url3);
            done();
          })
          .catch((ex) => {
            fail(ex);
            done();
          });
      })
      .catch((ex) => {
        fail(ex);
        done();
      });
  });

  it("can delete a service from the manifest, returning the new manifest", (done) => {
    const service4 = "fs-service-4";
    const url4 = "http://localhost:7654/4.js";
    const service5 = "fs-service-5";
    const url5 = "http://localhost:7654/5.js";

    api
      .patchService(service4, url4)
      .then(() => {
        api
          .patchService(service5, url5)
          .then(() => {
            api
              .deleteService(service4)
              .then((delRes) => {
                expect(delRes.sofe.manifest[service4]).toBe(undefined);
                api
                  .getManifest()
                  .then((getRes) => {
                    expect(delRes.sofe.manifest[service4]).toBe(undefined);
                  })
                  .catch((ex) => {
                    fail(ex);
                    done();
                  });
                done();
              })
              .catch((ex) => {
                fail(ex);
                done();
              });
          })
          .catch((ex) => {
            fail(ex);
            done();
          });
      })
      .catch((ex) => {
        fail(ex);
        done();
      });
  });
});
