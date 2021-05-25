import * as core from "@actions/core";

import { getConfig } from "../src/config";
import type { Config } from "../src/config";

const originalGitHubWorkspace = process.env["GITHUB_WORKSPACE"];

export const baseInputs: Config = {
  package: "semver",
  directory: "../",
  range: "^7.3.0",
};

export const mockedGetInput = (name: string, inputs = baseInputs) =>
  inputs[name];

export const overrideGetInput = (
  name: string,
  value: any,
  inputs = baseInputs
) => {
  jest.spyOn(core, "getInput").mockClear();
  jest.spyOn(core, "getInput").mockImplementation((inputName) => {
    if (name === inputName) return value;

    return mockedGetInput(inputName, inputs);
  });
};

describe("config", () => {
  beforeEach(() => {
    delete process.env["GITHUB_WORKSPACE"];
    jest.resetAllMocks();

    jest
      .spyOn(core, "getInput")
      .mockImplementation((name) => mockedGetInput(name));
  });

  afterAll(() => {
    delete process.env["GITHUB_WORKSPACE"];
    process.env["GITHUB_WORKSPACE"] = originalGitHubWorkspace;

    jest.restoreAllMocks();
  });

  describe("matches expected", () => {
    test("with baseInput", () => {
      expect(() => getConfig()).not.toThrow();
      expect(getConfig()).toEqual({
        ...baseInputs,
        allow_multiple_versions: false,
        version_prerelease: false,
      });
    });

    test("all available default values", () => {
      process.env.GITHUB_WORKSPACE = "./mocked_directory";
      overrideGetInput(undefined, undefined, {
        package: "required",
        range: "required",
      });

      expect(() => getConfig()).not.toThrow();
      expect(getConfig()).toEqual({
        package: "required",
        directory: "./mocked_directory",
        range: "required",
        allow_multiple_versions: false,
        version_prerelease: false,
      });
    });
  });

  test.each(["package", "directory", "range"])(
    "throws an error when %p is not included",
    (name) => {
      overrideGetInput(name, undefined);

      expect(() => getConfig()).toThrowError(
        `⚠️ The input variable '${name}' is required.`
      );
    }
  );

  test.each(["package", "directory", "range"])(
    "throws an error when %p is not a string",
    (name) => {
      overrideGetInput(name, 1);

      expect(() => getConfig()).toThrowError(
        `⚠️ The input variable '${name}' is of the wrong type.  Received 'number', expected 'string'.`
      );
    }
  );

  describe("allow_multiple_versions", () => {
    test("non-boolean-like values are coerced to a boolean false", () => {
      overrideGetInput("allow_multiple_versions", "string");

      expect(getConfig().allow_multiple_versions).toBe(false);
    });

    test.each([true, "TRUE", "true"])("allows %p", (value) => {
      overrideGetInput("allow_multiple_versions", value);

      expect(getConfig().allow_multiple_versions).toBe(true);
    });

    test.each([false, "FALSE", "false"])("allows %p", (value) => {
      overrideGetInput("allow_multiple_versions", value);

      expect(getConfig().allow_multiple_versions).toBe(false);
    });

    test("defaults to false", () => {
      overrideGetInput("allow_multiple_versions", undefined);

      expect(getConfig().allow_multiple_versions).toBe(false);
    });
  });

  describe("version_prerelease", () => {
    test.each([undefined, false, "semver", "alpha", "anything.1"])(
      "version_prerelease=%p passes",
      (value) => {
        overrideGetInput("version_prerelease", value);

        expect(() => getConfig()).not.toThrow();
        expect(getConfig()).toEqual({
          ...baseInputs,
          allow_multiple_versions: false,
          version_prerelease: value || false, // defaults to false
        });
      }
    );

    test("throws an error when version_prerelease is not a string or boolean", () => {
      overrideGetInput("version_prerelease", 1);

      expect(() => getConfig()).toThrowError(
        `⚠️ The input variable 'version_prerelease' is of the wrong type.  Received 'number', expected 'string | boolean'.`
      );
    });
  });
});
