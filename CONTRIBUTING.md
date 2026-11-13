# Contributing

Thanks for your interest in improving **@majornutcracker/react-native-selectable-text**! This guide covers how to set up the project, the workflow, and the conventions we follow.

By contributing, you agree that your contributions are licensed under the project's [MIT License](./LICENSE), and that you will follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

Found a security issue? Do **not** open a public issue — see [SECURITY.md](./SECURITY.md).

## Prerequisites

- **Node** — the version is pinned in [`.nvmrc`](./.nvmrc). Run `nvm use` (or install that version).
- **Yarn 1 (Classic)** — managed via Corepack, pinned through the `packageManager` field. Enable it once per Node version:
  ```sh
  corepack enable
  ```
- **iOS**: Xcode + CocoaPods. **Android**: Android Studio + JDK. (Only needed to build the native example.)

## Getting started

```sh
git clone https://github.com/majornutcracker/react-native-selectable-text
cd react-native-selectable-text
nvm use
corepack enable
yarn install
yarn build          # compiles the module (expo-module build)
```

Run the example app:

```sh
cd example
yarn install
yarn ios            # or: yarn android
```

## Project layout

- `src/` — the module's TypeScript source (the published API).
  - `SelectableTextView.tsx` — the React component and its ref API.
  - `utils.ts` — the WebView HTML/JS runtime (the bridge lives here).
  - `types.ts` — public types and `BridgingNames` (the RN ↔ WebView message contract).
  - `rangy@1.3.2/` — vendored [Rangy](https://github.com/timdown/rangy) (do **not** edit or strip its copyright headers; see [THIRD-PARTY-NOTICES.md](./docs/THIRD-PARTY-NOTICES.md)).
- `android/`, `ios/` — the native Kotlin/Swift bridge.
- `example/` — a runnable Expo app used as the manual test bed.
- `snack/` — the source of the published [Expo Snack](./snack/README.md), kept
  here and copied into Snack by hand.
- `react-native-libraries-entry.json` — our entry in
  [React Native Directory](https://github.com/react-native-community/directory),
  the listing most people browse before picking a library. The directory keeps
  the real copy inside its own `react-native-libraries.json`; this file is the
  local original, so a change here is not live until it is sent over as a pull
  request to that repository. Update it when a platform flag changes, when the
  example or demo links move, or when a new one (such as the Snack) is worth
  listing under `examples`.

When adding a bridge message, keep the three sides in sync: `BridgingNames` (types.ts), the WebView handler (utils.ts), and the RN handler (SelectableTextView.tsx).

## Checks

Everything must pass before a PR is merged:

```sh
yarn lint           # eslint + prettier (expo-module lint)
yarn format         # auto-fix formatting (prettier --write .)
yarn typecheck      # tsc --noEmit
yarn test           # jest test suite
```

A pre-commit hook (Husky + lint-staged) runs Prettier and ESLint on staged files automatically.

### Tests

Tests live in `src/__tests__/` and run with Jest (configured in `jest.config.cjs` as two projects):

- **`*.test.ts`** — pure unit tests in a Node environment (e.g. the `utils.ts` string/CSS/font helpers).
- **`*.test.tsx`** — component/bridge tests in the `jest-expo` environment; `react-native-webview` is mocked so the RN ↔ WebView message flow can be asserted.

The WebView runtime itself (the injected JS string in `utils.ts`) is not unit-tested here — verify those changes by running the example app.

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

1. `checks` — `yarn lint`, `yarn test`, `yarn typecheck`.
2. `android` / `ios` — prebuild and compile the example app (Gradle and CocoaPods caches speed up re-runs).

Native builds only run after `checks` passes. Keep CI green before requesting a review.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint on a `commit-msg` hook. Format:

```
<type>: <subject>
```

Allowed **types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `bump`.

Subject rules: keep it short and do **not** start it with a capital / Title Case (identifiers like `onHighlightPressed` mid-sentence are fine).

Examples:

```
feat: add onHighlightsVisibilityStateChange callback
fix: avoid duplicate onTextSelectionChange events
docs: document the highlighters animation option
```

## Pull requests

1. Fork and branch off `main` (e.g. `feat/my-change`).
2. Make your change and keep the public API documented (JSDoc in `types.ts`, plus the README table). Add usage to `example/` when it helps.
3. Run the checks above; make sure the example still builds/runs for a native change.
4. Update [`CHANGELOG.md`](./CHANGELOG.md) under an "Unreleased" section.
5. Open the PR with a clear description of the change and how you tested it.

## Releasing

Bumping the version touches several native files, not just `package.json`. See
[docs/VERSION-UPDATE.md](./docs/VERSION-UPDATE.md) for the full checklist and how to pick a
patch / minor / major bump.

## Reporting issues

Open a GitHub issue using the **Bug report** or **Feature request** template — they prompt for
everything we need (what you expected, what happened, a minimal repro, and your environment:
OS, Expo SDK, React Native, and this package's version).

For anything security-related, use [SECURITY.md](./SECURITY.md) instead of a public issue.
