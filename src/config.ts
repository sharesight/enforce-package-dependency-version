import { getInput } from "@actions/core";

export interface Config {
  package: string;
  range: string;
  directory?: string; // defaults to `process.env.GITHUB_WORKSPACE`
  allow_multiple_versions?: boolean; // defaults to `false`
  version_prerelease?: string | boolean; // defaults to `false`
}

const assertRequired = (config: Config, key: string): void => {
  if (!config[key])
    throw new Error(`⚠️ The input variable '${key}' is required.`);
};

const assertType = (
  config: Config,
  key: string,
  types: string | string[]
): void => {
  let pass;
  const typesArray: string[] = [].concat(types);

  typesArray.forEach((type) => {
    if (pass) return;
    if (typeof config[key] === type) pass = true;
  });

  if (!pass) {
    throw new Error(
      `⚠️ The input variable '${key}' is of the wrong type.  Received '${typeof config[
        key
      ]}', expected '${typesArray.join(" | ")}'.`
    );
  }
};

// NOTE: We're not using `getBooleanInput` from `actions/core` as ours isn't always a boolean…
const getForcedBooleanInput = (key: string): boolean | undefined | null => {
  const value = getInput(key);
  if (value === undefined) return;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return null;
};

const getBooleanStringInput = (key: string): boolean | string | undefined => {
  const value = getForcedBooleanInput(key);
  if (value !== null) return value;

  // NOTE: Sometimes this returns a non-boolean string.
  return getInput(key);
};

export const getConfig = (): Config => {
  const config: Config = {
    package: getInput("package", { required: true }),
    directory: getInput("directory") || process.env.GITHUB_WORKSPACE,
    range: getInput("range", { required: true }),
    version_prerelease: getBooleanStringInput("version_prerelease") || false,
    allow_multiple_versions:
      getForcedBooleanInput("allow_multiple_versions") || false,
  };

  // These are required strings.
  ["package", "directory", "range"].forEach((key) => {
    assertRequired(config, key);
    assertType(config, key, "string");
  });

  // Optional Boolean
  assertType(config, "allow_multiple_versions", "boolean");

  // 'version_prerelease' is not required and can be either a string or boolean
  assertType(config, "version_prerelease", ["string", "boolean"]);

  return config;
};
