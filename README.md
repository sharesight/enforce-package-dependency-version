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
        uses: kylorhall/enforce-package-dependency-version@v1.1.1
        with:
          package: "typescript"
          range: ">=4.2.0"

      - name: Debug
        if: always()
        run: |
          echo target_version: ${{ steps.enforce.outputs.target_version }}
          echo resolved_version: ${{ steps.enforce.outputs.resolved_version }}
```

# Valid Inputs

- **`package`** _[required]_
  - The name of the dependency to check.
- **`directory`**
  - Directory where your `package.json` can be found.
  - Defaults to to `env.GITHUB_WORKSPACE`.
- **`range`** _[required]_
  - A semver range, eg. '^1.0.0', '1.0.0', '>=1.x', etc..

---

# Development of this Action

## Start Development

```bash
yarn install
code .
yarn jest:tdd
```

## Release

Manually build a New Release: [here](https://github.com/kylorhall/enforce-package-dependency-version/releases/new)

1. Deicde on a semver like `v1.2.3`
2. :warning: Point the release to the correct commit (not _main_). `@latest` isn't used.
3. Bump this version in `package.json` file—just for the sake of it.
4. Bump this version in `.github/workflows/package-enforcement.yml` file.
5. Bump this version in `README.md` file.
