const { findUrlsToValidateInServices } = require("../src/verify-valid-url");
const {
  verifyInputFormatForServices,
} = require("../src/verify-valid-input-format");

describe(`/import-map.json - services validation`, () => {
  it("finds all input format issues", async () => {
    const wrongTypeImportMap = {
      imports: {
        a: { type: "not string" },
      },
    };
    let issues = verifyInputFormatForServices(wrongTypeImportMap.imports);
    expect(issues.length).toBe(1);

    const trailingSlashImportMap = {
      imports: {
        "/path/with/slash/": "https://cdn.com/path/without/slash.mjs",
      },
    };
    issues = verifyInputFormatForServices(trailingSlashImportMap.imports);
    expect(issues.length).toBe(1);
  });

  it(`finds all urls that have to be validated.`, async () => {
    const mockImportMap = {
      imports: {
        a: "https://cdn.com/a-1.mjs",
        b: "https://cdn.com/b-1.mjs",
        c: "https://cdn.com/c-1.mjs",
        "https://cdn.com/d-1.mjs": "https://cdn.com/d-update.mjs",
      },
    };
    const issues = verifyInputFormatForServices(mockImportMap.imports);
    expect(issues).toStrictEqual([]);

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
        "/scope2/scope3/": "/b-3/test/",
        "https://cdn.com/test/testfile.js": "./testfile2.js",
      },
    };
    const issues = verifyInputFormatForServices(mockImportMap.imports);
    expect(issues).toStrictEqual([]);

    const toBeVerifiedUrls = findUrlsToValidateInServices(
      mockImportMap.imports
    );

    expect(toBeVerifiedUrls).toEqual(["https://cdn.com/test/testfile2.js"]);
  });
});
