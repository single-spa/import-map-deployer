const { findUrlsToValidateInScopes } = require("../src/verify-valid-url");
const {
  verifyInputFormatForScopes,
} = require("../src/verify-valid-input-format");
describe(`/import-map.json - Scopes`, () => {
  it("finds all input format issues", async () => {
    const invalidTypeImportMap = {
      scopes: "type not a object",
    };
    let issues = verifyInputFormatForScopes(invalidTypeImportMap.scopes);
    expect(issues.length).toBe(1);

    const invalidSubtypeImportMap = {
      scopes: {
        scope: "type not a object",
      },
    };
    issues = verifyInputFormatForScopes(invalidSubtypeImportMap.scopes);
    expect(issues.length).toBe(1);

    const emptyScopeImportMap = {
      scopes: {
        emptyScope: {},
      },
    };
    issues = verifyInputFormatForScopes(emptyScopeImportMap.scopes);
    expect(issues.length).toBe(1);
  });

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

    const issues = verifyInputFormatForScopes(mockImportMap.scopes);
    expect(issues).toStrictEqual([]);

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

    const issues = verifyInputFormatForScopes(mockImportMap.scopes);
    expect(issues).toStrictEqual([]);

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
    const issues = verifyInputFormatForScopes(mockImportMap.scopes);
    expect(issues).toStrictEqual([]);

    const toBeVerifiedUrls = findUrlsToValidateInScopes(mockImportMap.scopes);

    expect(toBeVerifiedUrls.sort()).toEqual(
      ["https://cdn.com/module1/56fsd678sfd/module2.js"].sort()
    );
  });
});
