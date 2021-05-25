import semver from "semver";
import type { SemVer } from "semver";

import { getConfig } from "./config";
import type { Config } from "./config";

import { getResolvedVersion } from "./version";

export function enforceVersion(config: Config = getConfig()): void {
  const version: string = getResolvedVersion(config);
  const parsedVersion: SemVer = semver.parse(version);

  if (!parsedVersion || !parsedVersion.version) {
    throw new Error(`⚠️ Could not parse a version out of '${version}'.`);
  }

  const range: string = config.range;

  const satisfies: boolean = semver.satisfies(parsedVersion.version, range, {
    includePrerelease: !!config.version_prerelease,
  });
  if (!satisfies) {
    throw new Error(
      `⚠️ Resolved version '${parsedVersion.version}' did not satisfy range '${range}'.`
    );
  }

  if (config.version_prerelease === true) {
    if (parsedVersion.prerelease && !parsedVersion.prerelease.length) {
      throw new Error(
        `⚠️ Expected a prerelease on '${parsedVersion.version}', got none.`
      );
    }
  } else if (config.version_prerelease === false) {
    if (parsedVersion.prerelease && parsedVersion.prerelease.length) {
      throw new Error(
        `⚠️ There should be no prerelease on '${
          parsedVersion.version
        }', received [${parsedVersion.prerelease.join(", ")}].`
      );
    }
  } else if (config.version_prerelease) {
    const split = config.version_prerelease.split(".");
    const tag: string = split[0];
    const identifier: string | undefined = split[1];

    // SemVer.prerelease: [prerelease, identifier]
    if (tag !== parsedVersion.prerelease[0]) {
      throw new Error(
        `⚠️ Prerelease on '${parsedVersion.version}' does not match version_prerelease tag of '${tag}'.`
      );
    }

    if (
      identifier !== undefined &&
      String(identifier) !== String(parsedVersion.prerelease[1])
    ) {
      throw new Error(
        `⚠️ Prerelease on '${parsedVersion.version}' does not match version_prerelease identifier of '${identifier}'.`
      );
    }
  }
}
