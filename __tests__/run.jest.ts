import path from "path";
import * as core from "@actions/core";

import type { Config } from "../src/config";

export const baseInputs: Config = {
  directory: path.resolve(__dirname, "./workspace"),
  package: "typescript",
  range: "4.x",
};

let setFailedSpy;
let setOutputSpy;

export const mockedGetInput = (name: string, inputs = baseInputs) =>
  inputs[name];
export const overrideInputs = (inputs) => {
  jest.spyOn(core, "getInput").mockClear();
  jest.spyOn(core, "getInput").mockImplementation((inputName) => {
    return mockedGetInput(inputName, { ...baseInputs, ...inputs });
  });
};

describe("run", () => {
  beforeEach(() => {
    jest
      .spyOn(core, "getInput")
      .mockImplementation((name) => mockedGetInput(name));

    setFailedSpy = jest.spyOn(core, "setFailed").mockImplementation();
    setOutputSpy = jest.spyOn(core, "setOutput").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("failing scenario: semver in both dependencies and devDependencies", () => {
    overrideInputs({ package: "semver" });

    // NOTE: This runs on load, this is how you do that…
    jest.isolateModules(() => {
      require("../src/run");
    });

    expect(setFailedSpy).toHaveBeenCalledTimes(1);
    expect(setFailedSpy).toHaveBeenCalledWith(
      "⚠️ Found 'semver' in both dependencies and devDependencies."
    );

    expect(setOutputSpy).not.toHaveBeenCalled();
  });

  test.each([true, "unreleased", "unreleased.2"])(
    `passing scenario: a prerelease with 'version_prerelease=%p'`,
    (prerelease) => {
      overrideInputs({
        package: "@kylorhall/enforce-package-dependency-version",
        range: "^1.0.0-unreleased", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
        version_prerelease: prerelease,
      });

      // NOTE: This runs on load, this is how you do that…
      // jest.resetModules();
      jest.isolateModules(() => {
        require("../src/run");
      });

      expect(setFailedSpy).not.toHaveBeenCalled();

      expect(setOutputSpy).toHaveBeenCalledTimes(2);
      expect(setOutputSpy).toHaveBeenCalledWith(
        "target_version",
        "^1.0.0-unreleased.2"
      ); // what is in `package.json`
      expect(setOutputSpy).toHaveBeenCalledWith(
        "resolved_version",
        "1.0.0-unreleased.2"
      ); // what is in `yarn.lock`
    }
  );

  test("failing scenario: a prerelease with 'version_prerelease=false'", () => {
    overrideInputs({
      package: "@kylorhall/enforce-package-dependency-version",
      range: "^1.0.0-unreleased", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
    });

    // NOTE: This runs on load, this is how you do that…
    // jest.resetModules();
    jest.isolateModules(() => {
      require("../src/run");
    });

    expect(setFailedSpy).toHaveBeenCalledTimes(1);
    expect(setFailedSpy).toHaveBeenCalledWith(
      "⚠️ There should be no prerelease on '1.0.0-unreleased.2', received [unreleased, 2]."
    );

    expect(setOutputSpy).toHaveBeenCalledTimes(2);
    expect(setOutputSpy).toHaveBeenCalledWith(
      "target_version",
      "^1.0.0-unreleased.2"
    ); // what is in `package.json`
    expect(setOutputSpy).toHaveBeenCalledWith(
      "resolved_version",
      "1.0.0-unreleased.2"
    ); // what is in `yarn.lock`
  });

  test("passing scenario: typescript (in devDependencies)", () => {
    overrideInputs({
      package: "typescript",
      range: "^4.2.0", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
    });

    // NOTE: This runs on load, this is how you do that…
    // jest.resetModules();
    jest.isolateModules(() => {
      require("../src/run");
    });

    expect(setFailedSpy).not.toHaveBeenCalled();

    expect(setOutputSpy).toHaveBeenCalledTimes(2);
    expect(setOutputSpy).toHaveBeenCalledWith("target_version", "^4.0.0"); // what is in `package.json`
    expect(setOutputSpy).toHaveBeenCalledWith("resolved_version", "4.2.4"); // what is in `yarn.lock`
  });

  test.each([true, false])(
    "passing scenario: a non-prerelease with version_prerelease=%p",
    (prerelease) => {
      overrideInputs({
        package: "typescript",
        range: "^4.2.0", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
        version_prerelease: prerelease,
      });

      // NOTE: This runs on load, this is how you do that…
      // jest.resetModules();
      jest.isolateModules(() => {
        require("../src/run");
      });

      expect(setFailedSpy).not.toHaveBeenCalled();

      expect(setOutputSpy).toHaveBeenCalledTimes(2);
      expect(setOutputSpy).toHaveBeenCalledWith("target_version", "^4.0.0"); // what is in `package.json`
      expect(setOutputSpy).toHaveBeenCalledWith("resolved_version", "4.2.4"); // what is in `yarn.lock`
    }
  );

  test("passing scenario: yallist (in dependencies) with allow_multiple_versions=true", () => {
    overrideInputs({
      package: "yallist",
      range: "1.x", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
      allow_multiple_versions: true,
    });

    // NOTE: This runs on load, this is how you do that…
    // jest.resetModules();
    jest.isolateModules(() => {
      require("../src/run");
    });

    expect(setFailedSpy).not.toHaveBeenCalled();

    expect(setOutputSpy).toHaveBeenCalledTimes(2);
    expect(setOutputSpy).toHaveBeenCalledWith("target_version", "^1.0.0"); // what is in `package.json`
    expect(setOutputSpy).toHaveBeenCalledWith("resolved_version", "1.1.0"); // what is in `yarn.lock`
  });

  test("failing scenario: yallist resolving to multiple versions without allow_multiple_versions=true", () => {
    overrideInputs({
      package: "yallist",
      range: "1.x", // the value we're testing for…may not 100% match `package.json` or `yarn.lock`
    });

    // NOTE: This runs on load, this is how you do that…
    // jest.resetModules();
    jest.isolateModules(() => {
      require("../src/run");
    });

    expect(setFailedSpy).toHaveBeenCalledTimes(1);
    expect(setFailedSpy).toHaveBeenCalledWith(
      "⚠️ Found 2 versions for 'yallist': [1.1.0, 4.0.0]"
    ); // what is in `package.json`

    expect(setOutputSpy).toHaveBeenCalledTimes(1);
    expect(setOutputSpy).toHaveBeenCalledWith("target_version", "^1.0.0"); // what is in `package.json`
    // NOTE: Because this fails finding 2 versions, this never sets this:
    expect(setOutputSpy).not.toHaveBeenCalledWith("resolved_version", "1.1.0"); // what is in `yarn.lock`
  });

  test.each(["package", "range"])("required property %p", (key) => {
    overrideInputs({
      [key]: undefined,
    });

    // NOTE: This runs on load, this is how you do that…
    // jest.resetModules();
    jest.isolateModules(() => {
      require("../src/run");
    });

    expect(setFailedSpy).toHaveBeenCalledTimes(1);
    expect(setFailedSpy).toHaveBeenCalledWith(
      `⚠️ The input variable '${key}' is required.`
    );
  });
});
