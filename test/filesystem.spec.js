'use strict';
const api = require('./http-api.js');

describe('filesystem end to end tests', () => {
  beforeAll(api.clearManifest)

  afterEach(api.clearManifest)

  it('returns a valid manifest when you get the manifest', () => {
    return api.getManifest()
      .then((manifest) => {
        expect(manifest).toEqual({sofe: {manifest:{}}});
        api.clearManifest();
      })
  });

  it(`error when patching a service with an invalid url`, () => {
    const serviceName = 'fs-service-1';
    const url = 'http://localhost:7654/noExisty.js';

    return api.patchService(serviceName, url)
      .then(() => {
        fail("should have errored");
      })
      .catch(ex => {
        expect(ex.response.text).toBe('The url does not exist for service fs-service-1: http://localhost:7654/noExisty.js');
      });
  });

  it(`can write a manifest, even if you've never written a manifest`, () => {
    const serviceName = 'fs-service-1';
    const url = 'http://localhost:7654/1.js';
    return api.patchService(serviceName, url).then(api.getManifest)
      .then(result => {
        expect(result.sofe.manifest[serviceName]).toEqual(url);
      })
  });

  it('can write two things into the manifest', () => {
    const service2 = 'fs-service-2';
    const url2 = 'http://localhost:7654/2.js';
    const service3 = 'fs-service-3';
    const url3 = 'http://localhost:7654/3.js';

    return api.patchService(service2, url2)
      .then(() => {
        return api.patchService(service3, url3)
          .then((result) => {
            expect(result.sofe.manifest[service2]).toEqual(url2);
            expect(result.sofe.manifest[service3]).toEqual(url3);
          })
      })
  });

  it('can delete a service from the manifest, returning the new manifest', () => {
    const service4 = 'fs-service-4';
    const url4 = 'http://localhost:7654/4.js';
    const service5 = 'fs-service-5';
    const url5 = 'http://localhost:7654/5.js';

    return api.patchService(service4, url4)
      .then(() => {
        return api.patchService(service5, url5)
          .then(() => {
            return api.deleteService(service4)
              .then((delRes) => {
                expect(delRes.sofe.manifest[service4]).toBe(undefined);
                return api.getManifest()
                  .then((getRes) => {
                    expect(delRes.sofe.manifest[service4]).toBe(undefined);
                  })
              })
          })
      })
  });
});
