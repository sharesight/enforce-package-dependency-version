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
        uses: kylorhall/enforce-package-dependency-version@v1.1.2
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

| Name                    | Description                                                                     | Example                     | Default Value          |
| ----------------------- | ------------------------------------------------------------------------------- | --------------------------- | ---------------------- |
| package                 | The name of the dependency to check.                                            | `'@kylorhall/package '`     | **[required]**         |
| directory               | Directory where your `package.json` can be found.                               | `'../packages/static-site'` | `env.GITHUB_WORKSPACE` |
| range                   | A semver range                                                                  | `'^1.2.3'`                  | **[required]**         |
| version_prerelease      | An optional prerelease target ([read more](#version_prerelease))                | `'alpha'`, `true`, `false`  | `false`                |
| allow_multiple_versions | Allow multiple versions to be resolved? ([read more](#allow_multiple_versions)) | `true`, `false`             | `false`                |

#### version_prerelease

- `false` – requires there is no prerelease.
- `true` – allows a prerelease—but it is not required! `1.2.3-prerelease` and `1.2.3` are both valid
- `'prerelease'` – means it must match that prerelease.
- `'prerelease.#'` – means it must match that prerelease and identifier.

#### allow_multiple_versions

_Example: you may have Typescript at `^4.2.0` in your codebase, but another package points to `3.x`…_

- `false` – means this should only ever resolve to a single version (and that should match our range)
- `true` – does not fail if there are multiple versions
  - :warning: NOTE: we only look at the first resolved version, assuming this is your version..

---

# Outputs

| Name             | Description                                                          | Type or Example Value                   |
| ---------------- | -------------------------------------------------------------------- | --------------------------------------- |
| resolved_version | The resolved version of that dependency, eg. in `yarn.lock`          | `'1.2.3'`, `'1.2.3-prerelease.1'`, etc… |
| target_version   | The target version of that dependency, eg. version in `package.json` | `'^1.2.3'`                              |

---

# Development of this Action

## Start Development

```bash
yarn install
code .
yarn jest:tdd
```

## Build & Release

#### Prepare Build

1. Deicde on a semver, eg. `1.2.3`.
2. Bump this version in `package.json` file—just for the sake of it.
3. Bump this version in `.github/workflows/package-enforcement.yml` file.
4. Bump this version in `README.md` file.
5. Run `yarn build` and commit that `dist/index.js` change.
6. Version bumps should go via a PR and be merged into _master_ before releasing.

#### Create the Release

Manually build a New Release: [here](https://github.com/kylorhall/enforce-package-dependency-version/releases/new)

1. Enter your tag based on the semver.
   - Your tag should be prepended with a `v`, eg. `v1.2.3`.
   - Do not use `@latest` tag.
2. :warning: Point the release to the correct commit (not _main_)! This should be the PR Merge commit.
3. Enter a title naming the release (eg. `v1.2.3: Brief description of changes`)
4. Enter a fuller description—link to commits, PRs, etc.
5. Release!
