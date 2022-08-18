import path from "path";
import { setFailed, setOutput } from "@actions/core";

import type { Config } from "../src/config";

export const baseInputs: Config = {
  directory: path.resolve(__dirname, "./workspace"),
  package: "typescript",
  range: "4.x",
};

jest.mock("@actions/core", () => ({
  getInput: jest.requireActual("@actions/core").getInput,
  setFailed: jest.fn(),
  setOutput: jest.fn(),
}));

export const runTest = (inputs?: object) => {
  // We first put all of our inputs into `process.env.INPUT_…` (etc).
  const inputObj = { ...baseInputs, ...inputs };
  const envKeyPairs = (
    Object.entries(inputObj) as [string, string | undefined][]
  ).map(([key, value]) => {
    return [`INPUT_${key.replace(/ /g, "_").toUpperCase()}`, value];
  });

  envKeyPairs.forEach(([key, value]) => {
    // don't set undefined values…
    if (value !== undefined && value !== null) {
      process.env[key] = String(value);
    }
  });
  // NOTE: This test runs on load, this is how we isolate that:
  jest.isolateModules(() => {
    require("../src/run");
  });

  // Delete all `process.env.INPUT_PACKAGE` we just set.
  envKeyPairs.forEach(([key]) => {
    delete process.env[key];
  });
};

describe("run", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("failing scenario: semver in both dependencies and devDependencies", () => {
    runTest({ package: "semver" });

    expect(setFailed).toHaveBeenCalledTimes(1);
    expect(setFailed).toHaveBeenCalledWith(
      "⚠️ Found 'semver' in both dependencies and devDependencies."
    );

    expect(setOutput).not.toHaveBeenCalled();
  });

  test.each([true, "unreleased", "unreleased.2"])(
    `passing scenario: a prerelease with 'version_prerelease=%p'`,
    (prerelease) => {
      runTest({
        package: "@sharesight/enforce-package-dependency-version",
        range: "^1.0.0-unreleased", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
        version_prerelease: String(prerelease),
      });

      expect(setFailed).not.toHaveBeenCalled();

      expect(setOutput).toHaveBeenCalledTimes(2);
      expect(setOutput).toHaveBeenCalledWith(
        "target_version",
        "^1.0.0-unreleased.2"
      ); // what is in `package.json`
      expect(setOutput).toHaveBeenCalledWith(
        "resolved_version",
        "1.0.0-unreleased.2"
      ); // what is in `yarn.lock`
    }
  );

  test("failing scenario: a prerelease with 'version_prerelease=false'", () => {
    runTest({
      package: "@sharesight/enforce-package-dependency-version",
      range: "^1.0.0-unreleased", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
    });

    expect(setFailed).toHaveBeenCalledTimes(1);
    expect(setFailed).toHaveBeenCalledWith(
      "⚠️ There should be no prerelease on '1.0.0-unreleased.2', received [unreleased, 2]."
    );

    expect(setOutput).toHaveBeenCalledTimes(2);
    expect(setOutput).toHaveBeenCalledWith(
      "target_version",
      "^1.0.0-unreleased.2"
    ); // what is in `package.json`
    expect(setOutput).toHaveBeenCalledWith(
      "resolved_version",
      "1.0.0-unreleased.2"
    ); // what is in `yarn.lock`
  });

  test("passing scenario: typescript (in devDependencies)", () => {
    runTest({
      package: "typescript",
      range: "^4.2.0", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
    });

    expect(setFailed).not.toHaveBeenCalled();

    expect(setOutput).toHaveBeenCalledTimes(2);
    expect(setOutput).toHaveBeenCalledWith("target_version", "^4.0.0"); // what is in `package.json`
    expect(setOutput).toHaveBeenCalledWith("resolved_version", "4.2.4"); // what is in `yarn.lock`
  });

  test.each([true, false])(
    "passing scenario: a non-prerelease with version_prerelease=%p",
    (prerelease) => {
      runTest({
        package: "typescript",
        range: "^4.2.0", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
        version_prerelease: String(prerelease),
      });

      expect(setFailed).not.toHaveBeenCalled();

      expect(setOutput).toHaveBeenCalledTimes(2);
      expect(setOutput).toHaveBeenCalledWith("target_version", "^4.0.0"); // what is in `package.json`
      expect(setOutput).toHaveBeenCalledWith("resolved_version", "4.2.4"); // what is in `yarn.lock`
    }
  );

  test("passing scenario: yallist (in dependencies) with allow_multiple_versions=true", () => {
    runTest({
      package: "yallist",
      range: "1.x", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
      allow_multiple_versions: String(true),
    });

    expect(setFailed).not.toHaveBeenCalled();

    expect(setOutput).toHaveBeenCalledTimes(2);
    expect(setOutput).toHaveBeenCalledWith("target_version", "^1.0.0"); // what is in `package.json`
    expect(setOutput).toHaveBeenCalledWith("resolved_version", "1.1.0"); // what is in `yarn.lock`
  });

  test("failing scenario: yallist resolving to multiple versions without allow_multiple_versions=true", () => {
    runTest({
      package: "yallist",
      range: "1.x", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
    });

    expect(setFailed).toHaveBeenCalledTimes(1);
    expect(setFailed).toHaveBeenCalledWith(
      "⚠️ Found 2 versions for 'yallist': [1.1.0, 4.0.0]"
    ); // what is in `package.json`

    expect(setOutput).toHaveBeenCalledTimes(1);
    expect(setOutput).toHaveBeenCalledWith("target_version", "^1.0.0"); // what is in `package.json`
    // NOTE: Because this fails finding 2 versions, this never sets this:
    expect(setOutput).not.toHaveBeenCalledWith("resolved_version", "1.1.0"); // what is in `yarn.lock`
  });

  test.each(["package", "range"])("required property %p", (key) => {
    runTest({
      [key]: undefined,
    });

    expect(setFailed).toHaveBeenCalledTimes(1);
    expect(setFailed).toHaveBeenCalledWith(
      `Input required and not supplied: ${key}`
    );
  });
});
