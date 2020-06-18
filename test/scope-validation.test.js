const { findUrlsToValidateInScopes } = require("../src/verify-valid-url");

describe(`/import-map.json - Scopes`, () => {
  // example https://github.com/WICG/import-maps#scoping-examples
  it(`finds all urls that have to be validated.`, async () => {
    const mockImportMap = {
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
    };

    const toBeVerifiedUrls = findUrlsToValidateInScopes(mockImportMap.scopes);

    expect(toBeVerifiedUrls.sort()).toEqual(
      ["https://cdn.com/a-2.mjs", "https://cdn.com/b-3.mjs"].sort()
    );
  });

  it(`does not validate relative urls.`, async () => {
    const mockImportMap = {
      imports: {
        a: "https://cdn.com/a-1.mjs",
        b: "https://cdn.com/b-1.mjs",
        c: "https://cdn.com/c-1.mjs",
      },
      scopes: {
        "/scope2/": {
          a: "https://cdn.com/a-2.mjs",
        },
        "/scope2/scope3/": {
          b: "/b-3.mjs",
        },
      },
    };

    const toBeVerifiedUrls = findUrlsToValidateInScopes(mockImportMap.scopes);

    expect(toBeVerifiedUrls).toEqual(["https://cdn.com/a-2.mjs"]);
  });

  it(`does find all urls that have to be validated.`, async () => {
    const mockImportMap = {
      imports: {
        module1: "https://cdn.com/module1/56fsd678sfd/module1.js",
      },
      scopes: {
        "https://cdn.com/module1/56fsd678sfd/": {
          module2: "./module2.js",
        },
      },
    };

    const toBeVerifiedUrls = findUrlsToValidateInScopes(mockImportMap.scopes);

    expect(toBeVerifiedUrls.sort()).toEqual(
      ["https://cdn.com/module1/56fsd678sfd/module2.js"].sort()
    );
  });
});
