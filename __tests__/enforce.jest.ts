import path from "path";

import { enforceVersion } from "../src/enforce";
import * as VersionImport from "../src/version";

const baseConfig = {
  directory: path.resolve(__dirname, "./workspace"),
};

describe("enforce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("when the version is missing", () => {
    const config = {
      ...baseConfig,
      range: "*",
      package: "not-an-included-package",
    };
    expect(() => enforceVersion(config)).toThrowError(
      "⚠️ Found no version for 'not-an-included-package'."
    );
  });

  test.each(["v1+A", "1,2,3", "bad-version", undefined])(
    "[mocked] when the version=%p cannot be parsed correctly…",
    (version) => {
      jest
        .spyOn(VersionImport, "getResolvedVersion")
        .mockImplementationOnce(() => version);

      const config = { ...baseConfig, range: "*", package: "semver" }; // doesn't really apply; we just mock the version above…
      expect(() => enforceVersion(config)).toThrowError(
        `⚠️ Could not parse a version out of '${version}'.`
      );
    }
  );

  describe("semver (in dependencies and devDependencies)", () => {
    const config = {
      ...baseConfig,
      package: "semver",
      range: "^7.3.0",
    };

    test.each([">=1", config.range, "<100.0.0"])(
      "passing: with range=%p",
      (range) => {
        expect(() => enforceVersion({ ...config, range })).not.toThrow();
      }
    );

    test.each(["1.2.3", "^99.00.00", "1.x"])(
      "failing: when the range=%p is bad",
      (range) => {
        expect(() => enforceVersion({ ...config, range })).toThrowError(
          `⚠️ Resolved version '7.3.5' did not satisfy range '${range}'.`
        );
      }
    );

    test.each([true, false])(
      "passing: when version_prerelease=%p (not a prerelease)",
      (prerelease) => {
        expect(() =>
          enforceVersion({ ...config, version_prerelease: prerelease })
        ).not.toThrow();
      }
    );

    test.each(["one", "two"])(
      "failing: when version_prerelease=%p (not a prerelease)",
      (prerelease) => {
        expect(() =>
          enforceVersion({ ...config, version_prerelease: prerelease })
        ).toThrowError(
          `⚠️ Prerelease on '7.3.5' does not match version_prerelease tag of '${prerelease}'.`
        );
      }
    );
  });

  describe("typescript (in devDependencies)", () => {
    const config = {
      ...baseConfig,
      package: "typescript",
      range: "^4.0.0",
    };

    test.each([">=4", config.range, "<5.0.0"])(
      "passing: with range=%p",
      (range) => {
        expect(() => enforceVersion({ ...config, range })).not.toThrow();
      }
    );

    test.each(["1.2.3", "^99.00.00", "5.x"])(
      "failing: when the range=%p is bad",
      (range) => {
        expect(() => enforceVersion({ ...config, range })).toThrowError(
          `⚠️ Resolved version '4.2.4' did not satisfy range '${range}'.`
        );
      }
    );
  });

  describe("@kylorhall/enforce-package-dependency-version (prerelease)", () => {
    const config = {
      ...baseConfig,
      package: "@kylorhall/enforce-package-dependency-version",
      range: "1.x",
      version_prerelease: true,
    };

    test.each([">=1", config.range, "<100.0.0"])(
      "passing: with range=%p",
      (range) => {
        expect(() => enforceVersion({ ...config, range })).not.toThrow();
      }
    );

    test.each(["unreleased", "unreleased.2"])(
      "passing: when prerelease=%p",
      (prerelease) => {
        expect(() =>
          enforceVersion({ ...config, version_prerelease: prerelease })
        ).not.toThrowError();
      }
    );

    test.each(["1.2.3", "^99.00.00", "2.x"])(
      "failing: when the range=%p is bad",
      (range) => {
        expect(() => enforceVersion({ ...config, range })).toThrowError(
          `⚠️ Resolved version '1.0.0-unreleased.2' did not satisfy range '${range}'.`
        );
      }
    );

    test("failing: when prerelease=false (not included in semver)", () => {
      expect(() =>
        enforceVersion({ ...config, version_prerelease: false })
      ).toThrowError(
        "⚠️ Resolved version '1.0.0-unreleased.2' did not satisfy range '1.x'."
      );
    });

    test.each(["other-prerelease", "released"])(
      "failing: when prerelease=%p (incorrect)",
      (prerelease) => {
        expect(() =>
          enforceVersion({ ...config, version_prerelease: prerelease })
        ).toThrowError(
          `⚠️ Prerelease on '1.0.0-unreleased.2' does not match version_prerelease tag of '${prerelease}'.`
        );
      }
    );

    test.each([1, 3, 99, "x", ""])(
      "failing: when prerelease.identifier=%p (incorrect)",
      (identifier) => {
        expect(() =>
          enforceVersion({
            ...config,
            version_prerelease: `unreleased.${identifier}`,
          })
        ).toThrowError(
          `⚠️ Prerelease on '1.0.0-unreleased.2' does not match version_prerelease identifier of '${identifier}'.`
        );
      }
    );
  });

  describe("yallist (multiple versions)", () => {
    const config = {
      ...baseConfig,
      package: "yallist",
      range: "1.1.0",
      allow_multiple_versions: true,
    };

    test.each([">=1", config.range, "<100.0.0"])(
      "passing: with range=%p",
      (range) => {
        expect(() => enforceVersion({ ...config, range })).not.toThrowError();
      }
    );

    test.each([">=2", "4.x"])("failing: with range=%p", (range) => {
      expect(() => enforceVersion({ ...config, range })).toThrowError(
        `⚠️ Resolved version '1.1.0' did not satisfy range '${range}'.`
      );
    });

    test("failing: without allow_multiple_versions=true", () => {
      expect(() =>
        enforceVersion({ ...config, allow_multiple_versions: false })
      ).toThrowError("⚠️ Found 2 versions for 'yallist': [1.1.0, 4.0.0]");
    });
  });
});
