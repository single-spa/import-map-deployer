const { findUrlsToValidateInServices } = require("../src/verify-valid-url");

describe(`/import-map.json - services validation`, () => {
  it(`finds all urls that have to be validated.`, async () => {
    const mockImportMap = {
      imports: {
        a: "https://cdn.com/a-1.mjs",
        b: "https://cdn.com/b-1.mjs",
        c: "https://cdn.com/c-1.mjs",
        "https://cdn.com/d-1.mjs": "https://cdn.com/d-update.mjs",
      },
    };

    const toBeVerifiedUrls = findUrlsToValidateInServices(
      mockImportMap.imports
    );

    expect(toBeVerifiedUrls.sort()).toEqual(
      [
        "https://cdn.com/a-1.mjs",
        "https://cdn.com/b-1.mjs",
        "https://cdn.com/c-1.mjs",
        "https://cdn.com/d-update.mjs",
      ].sort()
    );
  });

  it(`does not validate relative urls.`, async () => {
    const mockImportMap = {
      imports: {
        "/scope2/": "https://cdn.com/a-2.mjs",
        "/scope2/scope3/": "/b-3.mjs",
        "https://cdn.com/test/testfile.js": "./testfile2.js",
      },
    };

    const toBeVerifiedUrls = findUrlsToValidateInServices(
      mockImportMap.imports
    );

    expect(toBeVerifiedUrls).toEqual([
      "https://cdn.com/a-2.mjs",
      "https://cdn.com/test/testfile2.js",
    ]);
  });
});
