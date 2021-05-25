# enforce-package-dependency-version

This Github Actions helps enforce that a specific package version, range, prerelease, etc exists in your `package.json` and `yarn.lock`.

:warning: Uses `yarn why …`, so only **yarn** is supported for now.

## Example Workflow

This action runs itself [here](https://github.com/kylorhall/enforce-package-dependency-version/blob/main/.github/workflows/package-enforcement.yml).

```yaml
name: Enforce Package

on: push

jobs:
  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: "Enforce Version"
        id: enforce
        uses: kylorhall/enforce-package-dependency-version@v1
        with:
          package: "typescript"
          range: ">=4.2.0"

      - name: Debug
        if: always()
        run: |
          echo target_version: ${{ steps.enforce.outputs.target_version }}
          echo resolved_version: ${{ steps.enforce.outputs.resolved_version }}
```

# Inputs

- **`package`** _[required]_
  - The name of the dependency to check.
- **`directory`**
  - Directory where your `package.json` can be found.
  - `default=env.GITHUB_WORKSPACE`
- **`range`** _[required]_
  - A semver range, eg. '^1.0.0', '1.0.0', '>=1.x', etc..
- **`version_prerelease`**
  - An optional prerelease target.
  - `default=false`
  - `false` requires there is no prerelease.
  - `true` allows a prerelease—but it is not required! `1.2.3-prerelease` and `1.2.3` are both valid
  - `'prerelease'` means it must match that prerelease.
  - `'prerelease.#'` means it must match that prerelease and identifier.
- **`allow_multiple_versions`**
  - Whether or not we allow multiple versions to be resolved, eg. you may have Typescript at `^4.2.0` in your codebase, but another package points to `3.x`.
  - `false` means this should only ever resolve to a single version (and that should match our range)
  - `true` allows all versions… NOTE: we only look at the first resolved version, assuming this is your version.

---

# Development of this Action

## Start Development

```bash
yarn install
code .
yarn jest:tdd
```

## Release

1. Bump a new `package.json` version (just for the sake of it).
2. Do not `yarn publish`…
3. Build a New Release: [here](https://github.com/kylorhall/enforce-package-dependency-version/releases/new)
