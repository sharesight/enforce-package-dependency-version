import path from "path";
import * as core from "@actions/core";

import {
  getTargetVersion,
  setTargetVersion,
  getResolvedVersion,
  setResolvedVersion,
} from "../src/version";

const baseConfig = {
  directory: path.resolve(__dirname, "./workspace"),
};

let setOutputSpy;

describe("version", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    setOutputSpy = jest.spyOn(core, "setOutput").mockImplementation();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("get + set ResolvedVersion", () => {
    test.each(["a", "b"])(
      "throws an error when package=%p is not found",
      (pkg) => {
        const config = { ...baseConfig, range: "*", package: pkg };
        const error = `⚠️ Found no version for '${pkg}'.`;

        // GET:
        expect(() => getResolvedVersion(config)).toThrow(error);

        // SET:
        expect(() => setResolvedVersion(config)).toThrow(error);

        expect(setOutputSpy).not.toHaveBeenCalled();
      }
    );

    test.each([
      // package, expectedVersion
      ["typescript", "4.2.4"],
      ["@kylorhall/enforce-package-dependency-version", "1.0.0-unreleased.2"],
    ])("returns/sets the resolved version", (pkg, expectedVersion) => {
      const config = { ...baseConfig, range: "*", package: pkg };

      // GET:
      expect(() => getResolvedVersion(config)).not.toThrow();
      expect(getResolvedVersion(config)).toEqual(expectedVersion);

      // SET:
      expect(setOutputSpy).not.toHaveBeenCalled();
      expect(() => setResolvedVersion(config)).not.toThrow();
      expect(setOutputSpy).toHaveBeenCalledWith(
        "resolved_version",
        expectedVersion
      );
    });

    describe("when resolving to multiple package versions", () => {
      test("throws an error with allow_multiple_versions=false", () => {
        const config = { ...baseConfig, range: "*", package: "yallist" };
        const error = "⚠️ Found 2 versions for 'yallist': [1.1.0, 4.0.0]";

        // GET:
        expect(() => getResolvedVersion(config)).toThrow(error);

        // SET:
        expect(() => setResolvedVersion(config)).toThrow(error);

        expect(setOutputSpy).not.toHaveBeenCalled();
      });

      test("returns/sets the first resolved version with allow_multiple_versions=true", () => {
        const config = {
          ...baseConfig,
          range: "*",
          package: "yallist",
          allow_multiple_versions: true,
        };
        const expectedVersion = "1.1.0";

        // GET:
        expect(() => getResolvedVersion(config)).not.toThrow();
        expect(getResolvedVersion(config)).toEqual(expectedVersion);

        // SET:
        expect(setOutputSpy).not.toHaveBeenCalled();
        expect(() => setResolvedVersion(config)).not.toThrow();
        expect(setOutputSpy).toHaveBeenCalledWith(
          "resolved_version",
          expectedVersion
        );
      });
    });
  });

  describe("get + set TargetVersion", () => {
    test.each(["a", "b"])("throws an error when not found", (pkg) => {
      const config = { ...baseConfig, range: "*", package: pkg };
      const error = `⚠️ '${pkg}' was not found in dependencies or devDependencies.`;

      // GET:
      expect(() => getTargetVersion(config)).toThrowError(error);

      // SET:
      expect(() => setTargetVersion(config)).toThrowError(error);
      expect(setOutputSpy).not.toHaveBeenCalled();
    });

    test("throws an error when found in both dependencies and devDependencies", () => {
      const config = { ...baseConfig, range: "*", package: "semver" };
      const error = `⚠️ Found 'semver' in both dependencies and devDependencies.`;

      // GET:
      expect(() => getTargetVersion(config)).toThrowError(error);

      // SET:
      expect(() => setTargetVersion(config)).toThrowError(error);
      expect(setOutputSpy).not.toHaveBeenCalled();
    });

    test.each([
      // package, expectedVersion
      ["typescript", "^4.0.0"],
      ["@kylorhall/enforce-package-dependency-version", "^1.0.0-unreleased.2"],
    ])("returns/sets the target version", (pkg, expectedVersion) => {
      const config = { ...baseConfig, range: "*", package: pkg };

      // GET:
      expect(() => getTargetVersion(config)).not.toThrow();
      expect(getTargetVersion(config)).toEqual(expectedVersion);

      // SET:
      expect(setOutputSpy).not.toHaveBeenCalled();
      expect(() => setTargetVersion(config)).not.toThrow();
      expect(setOutputSpy).toHaveBeenCalledWith(
        "target_version",
        expectedVersion
      );
    });
  });
});
