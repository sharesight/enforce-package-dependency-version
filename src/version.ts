import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

import { setOutput } from "@actions/core";

import { getConfig } from "./config";
import type { Config } from "./config";

interface PackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export function getTargetVersion(config: Config = getConfig()): string {
  const packageJsonBuffer: Buffer = fs.readFileSync(
    path.join(config.directory, "package.json")
  );
  const packageJson: PackageJson = JSON.parse(
    packageJsonBuffer.toString("utf8")
  );

  const dependencies = packageJson.dependencies;
  const dependencyVersion = dependencies[config.package];

  const devDependencies = packageJson.devDependencies;
  const devDependencyVersion = devDependencies[config.package];

  if (dependencyVersion && devDependencyVersion) {
    throw new Error(
      `⚠️ Found '${config.package}' in both dependencies and devDependencies.`
    );
  }

  if (dependencyVersion) return dependencyVersion;
  if (devDependencyVersion) return devDependencyVersion;

  throw new Error(
    `⚠️ '${config.package}' was not found in dependencies or devDependencies.`
  );
}

export function setTargetVersion(config: Config = getConfig()): void {
  const version: string = getTargetVersion(config);
  setOutput("target_version", version);
}

const foundRegex: RegExp = /Found "([^"]+)"$/; // looking for `Found "package@version"`, matching on `package@version`

export function getResolvedVersion(config: Config = getConfig()): string {
  const yarnWhyBuffer = spawnSync("yarn", ["why", config.package], {
    cwd: config.directory,
  });
  const yarnWhyLines = yarnWhyBuffer.stdout.toString().split("\n"); // split a CLI buffer into an array of lines
  const yarnWhyFound = yarnWhyLines.filter((line) => {
    // grab only the lines with the Found regex in them…
    return line?.length >= 0 && line.match(foundRegex);
  });

  const versionsList = yarnWhyFound.map((output) => {
    const found: any[] = output.match(foundRegex);
    if (!found[1]) return; // this should be semver: `package@1.2.3-pre-release.0`

    const split: string[] = found[1].split("@"); // split so we can get the version.  NOTE: This may be `@org/package@version`—so there may be multiple '@' symbols.
    if (!split.length) return;

    const version: string = split[split.length - 1];
    return version;
  });

  if (!versionsList.length)
    throw new Error(`⚠️ Found no version for '${config.package}'.`);
  if (versionsList.length > 1 && config.allow_multiple_versions !== true) {
    throw new Error(
      `⚠️ Found ${versionsList.length} versions for '${
        config.package
      }': [${versionsList.join(", ")}]`
    );
  }

  return versionsList[0];
}

export function setResolvedVersion(config: Config = getConfig()): void {
  const version: string = getResolvedVersion(config);
  setOutput("resolved_version", version);
}
