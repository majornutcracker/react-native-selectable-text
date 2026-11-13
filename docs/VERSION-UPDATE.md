# Updating the version

The package version follows [Semantic Versioning](https://semver.org/). `package.json`
is the source of truth, but several native files **hardcode** the same version and must be
kept in sync by hand. This guide lists every place to change and how to pick the bump, then
the references that are merely cosmetic and the other version strings in the repo that drift
the same way without being the package version.

## Which bump?

Given `MAJOR.MINOR.PATCH`:

- **PATCH** (`1.0.0 → 1.0.1`) — bug fixes only; no public API change. This includes
  changes to what the package _says about itself_ — `author`, `description`,
  `keywords`, the README — which only reach npm and React Native Directory inside a
  published version. A metadata-only patch is how they get fixed.
- **MINOR** (`1.0.0 → 1.1.0`) — new backward-compatible API (a new prop, ref method, callback,
  highlighter option, or bridge event that doesn't break existing usage).
- **MAJOR** (`1.0.0 → 2.0.0`) — breaking change to the public API or the RN ↔ WebView bridge
  contract (renamed/removed prop or method, changed message shape, changed default behavior).

## Files to update (must all match)

| File                                                                                                                       | What to change                                | Note                                       |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| `package.json`                                                                                                             | `"version"`                                   | Source of truth.                           |
| `src/types.ts`                                                                                                             | `export const VERSION`                        | JS constant exposed to consumers.          |
| `android/build.gradle`                                                                                                     | `version = '…'`                               | Semver string.                             |
| `android/build.gradle`                                                                                                     | `versionName "…"`                             | Semver string (same value).                |
| `android/build.gradle`                                                                                                     | `versionCode`                                 | **Integer, +1 every release** (see below). |
| `android/src/main/java/com/majornutcracker/reactnativeselectablewebview/MajornutcrackerReactNativeSelectableTextModule.kt` | the string inside `Constant("version") { … }` | Native `version` constant (Android).       |
| `ios/MajornutcrackerReactNativeSelectableTextModule.swift`                                                                 | the string inside `Constant("version") { … }` | Native `version` constant (iOS).           |

### `versionCode` is not the semver

`versionCode` is an Android build counter. It must **increase by exactly 1 on every release**,
regardless of whether the release is a patch, minor, or major. It is independent of
`versionName`/semver.

## Cosmetic references (nice to keep current, never release-blocking)

The release workflow does not look at these, and a stale value here publishes a perfectly
good package. Refresh them when you remember.

| File                                    | What to change                                                     | Note                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | `placeholder:` under the version input                             | Shows a greyed-out example version in the bug form.                                        |
| `snack/package.json`                    | the pinned `@majornutcracker/react-native-selectable-text` version | The Snack demo installs exactly that version, so a stale pin shows the world an old build. |

The Snack itself is a hand-kept copy of `snack/`, so bumping the file here is
only half of it: open the published Snack and raise the pinned version in its
dependency panel too. Until you do, the "try it" link everyone clicks — the
README, the React Native Directory entry, answers that point at it — is running
the previous release. See [`snack/README.md`](../snack/README.md) for the full
procedure.

## Do NOT edit (auto-derived)

- `ios/MajornutcrackerReactNativeSelectableText.podspec` — `s.version = package['version']`
  reads `package.json` at pod-install time. Its `summary`, `description`, `license`, `author`,
  and `homepage` also come from `package.json`. Leave it alone.
- `example/package.json` and `example/app.json` — the example app has its own versioning,
  irrelevant to the published package. Do not bump it as part of a release.
- This guide — the versions in it (`1.0.0 → 1.1.0`, `git tag v1.1.0`, …) are examples of the
  procedure, not values to keep in sync with the package.

## Changelog

[`CHANGELOG.md`](../CHANGELOG.md) follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
For each release:

1. Rename `## [Unreleased]` to `## [1.1.0] - YYYY-MM-DD` (release date, ISO format) and add a
   fresh, empty `## [Unreleased]` above it.
2. Group the entries under `### Added`, `### Changed`, `### Deprecated`, `### Removed`,
   `### Fixed`, or `### Security`.
3. Update the link references at the bottom:
   ```md
   [unreleased]: https://github.com/majornutcracker/react-native-selectable-text/compare/v1.1.0...HEAD
   [1.1.0]: https://github.com/majornutcracker/react-native-selectable-text/compare/v1.0.0...v1.1.0
   ```

This file is maintainer-only: it is excluded from the npm package (see `files` in
`package.json`), while the rest of `docs/` ships.

## Verify everything matches

After bumping, confirm there is no drift (replace with the new version):

```sh
grep -RIn "1\.1\.0" \
  package.json \
  src/types.ts \
  android/build.gradle \
  android/src/main/java/com/majornutcracker/reactnativeselectablewebview/MajornutcrackerReactNativeSelectableTextModule.kt \
  ios/MajornutcrackerReactNativeSelectableTextModule.swift \
  snack/package.json \
  .github/ISSUE_TEMPLATE/bug_report.yml
```

Every listed file should appear (and `versionCode` should be one higher than before).
The last two are the [cosmetic references](#cosmetic-references-nice-to-keep-current-never-release-blocking):
the release does not check them, so this is the only place a stale one gets caught.

## Other version strings in this repo

These are **not** the package version and do not move during a release, but they are
duplicated by hand in the same way, so they drift in the same way. Each list is every place
that has to agree.

### The supported `react-native-webview` range

Changing which versions the module supports means touching all four:

| File                   | What                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `package.json`         | `devDependencies` — the exact version developed and tested against.                      |
| `package.json`         | `peerDependencies` — the range a consumer's app must satisfy.                            |
| `README.md`            | The **Peer dependencies** sentence, which repeats the range in prose.                    |
| `example/package.json` | The example app's own pin. Keep it inside the peer range, or the example proves nothing. |

### The vendored Rangy copy

Rangy is vendored as `src/rangy@1.3.2/`, so its version is part of a **directory name** and
turns up in imports, tooling config and docs. Upgrading it is a rename plus all of these:

- `src/utils.ts` and `src/__tests__/ignoredElements.test.ts` — the import paths.
- `eslint.config.js`, `.prettierignore`, `.gitattributes` — the lint, format and vendoring rules.
- `.github/CODEOWNERS` — the ownership entry.
- `docs/THIRD-PARTY-NOTICES.md` — the `## Rangy (v1.3.2)` heading and the path below it.
- `CONTRIBUTING.md` and `SECURITY.md` — both name the folder in prose.

To catch the stragglers after a rename:

```sh
grep -rIn "rangy@" --exclude-dir=node_modules --exclude-dir=build .
```

## Suggested release flow

Publishing is automated: the [`Release`](../.github/workflows/release.yml) workflow triggers on
any pushed tag matching `v*.*.*`. Do **not** run `npm publish` by hand.

`main` is protected by a ruleset: nothing is pushed to it directly, a pull request is
required, and the `Lint · test · typecheck` check has to pass. So the bump travels in a PR.

1. On a branch, bump every file in [Files to update](#files-to-update-must-all-match) and
   update `CHANGELOG.md`. The cosmetic references can ride along.
2. Commit — `bump:` or `chore:` per the commit conventions, e.g. `bump: v1.1.0`.
3. Open a pull request, let CI pass and merge it. Then update your local `main`:
   ```sh
   git checkout main && git pull --ff-only
   ```
4. Tag **that merge commit** and push the tag — this is the step that publishes:
   ```sh
   git tag v1.1.0
   git push origin v1.1.0
   ```
5. The workflow then, in order: verifies the tag matches `package.json`, checks the native files
   for version drift (the table above), runs lint/test/typecheck, publishes to npm with
   provenance (the `prepublishOnly` script builds first), and opens a GitHub Release with
   generated notes.
6. After it finishes, see [After publishing](#after-publishing).

If the tag and `package.json` disagree, or any native file still holds the old version, the
workflow fails **before** publishing. To recover, delete the tag (`git push --delete origin
v1.1.0`), fix the versions, and re-tag.

A second ruleset protects `v*` tags: they cannot be force-pushed or moved. Deleting one is
allowed on purpose, so the recovery above works — but **only before the workflow has
published**. Once npm has the version it is immutable; do not re-tag it. Fix forward with the
next patch.

### After publishing

npm takes a few minutes to show a new version, and the checks below lag behind it:

- **npm** — `npm view @majornutcracker/react-native-selectable-text version --prefer-online`
  shows the new version, and the version has provenance.
- **The Snack** — raise the pinned version in the published Snack's dependency panel, and
  paste any file under `snack/` that changed. This is not automated; see
  [`snack/README.md`](../snack/README.md).
- **React Native Directory** — the listing rebuilds from npm roughly every two hours. The
  versions tab reads npm live; the score and the rest of the card follow at the next rebuild.
  `https://reactnative.directory/api/libraries?search=selectable-text` shows what it holds.

### Required repository secret

- `NPM_TOKEN` — an npm automation token with publish rights on the `@majornutcracker` scope.
  It is the only publishing credential today, and it is meant to be replaced by npm Trusted
  Publishing (OIDC from GitHub Actions) when the GitHub account is renamed, because the trusted
  publisher pins the owner and repository.

> Tip: the native/gradle files duplicate the version by hand, which is easy to forget. A future
> improvement is to read the version from `package.json` in `build.gradle` and expose the JS
> `VERSION` from the native `version` constant, so only `package.json` needs bumping.
