# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.2] - 2026-11-12

### Changed

- The GitHub account moved from `majornutcracker-dev` to `majornutcracker`.
  The `repository`, `bugs` and `author` fields, the podspec source and every
  link in the shipped docs now point at
  `github.com/majornutcracker/react-native-selectable-text`.

## [1.2.1] - 2026-10-09

### Fixed

- The `author` field carried a bare name where npm expects a URL, so the
  registry stored `"url": "JoshuaPariona"` and React Native Directory linked the
  author to a page that does not exist. It now points at the GitHub profile.

### Changed

- The README's installation section lists `npx expo install`, npm, yarn, pnpm
  and bun, each in its own block so every command gets its own copy button.

## [1.2.0] - 2026-09-24

> **Read this before upgrading.** The `highlights` prop is gone, so code that
> passes it no longer compiles. Rename it to `initialHighlights` for the value
> the view mounts with, and call `setHighlights()` for every change after that.
> The replacement is not a drop-in: `initialHighlights` is read **once**, when
> the content is built, and changing it later does nothing.
>
> ```diff
> - <SelectableTextView highlights={saved} />
> + <SelectableTextView initialHighlights={saved} />
> + // later: ref.current?.setHighlights(payload)
> ```

### Added

- `setHighlights(payload)` on the ref replaces every highlight in a mounted
  view; `""` clears them.
- An undo history, kept by the view itself: `undo()`, `redo()` and
  `clearHistory()` on the ref, and `getHistory()` to read it.
- `onHistoryChange`, which reports where the history stands — including
  `canUndo` and `canRedo` — so undo and redo controls enable themselves without
  tracking anything. The history records content changes only (highlighting,
  unhighlighting, clearing and `setHighlights`) and holds the last 50 states.
- `initialHighlights`, the serialized highlights painted when the view mounts.

### Changed

- A payload that is not a serialized highlights string is now refused through
  `onError` with `invalid_highlight` **without touching the highlights already
  on screen**. It used to remove them first and fail afterwards, so a bad
  string cost the reader their highlights.
- Stepping through the history no longer replays a highlight's entrance
  animation: an undo restores something the reader has already seen.

### Removed

- The `highlights` prop, replaced as described above. It was both the mount
  value and a controlled state prop, which meant the view had to guess which
  values were genuine and which were its own report coming back — restoring
  through it was unpredictable, and undo on top of it needed a stack, an echo
  flag and string-identity reasoning in every consumer.

## [1.1.0] - 2026-09-23

### Changed

- The native module is now optional, so importing the package no longer throws
  where that module is not in the binary — Expo Go and Snack among them, which
  already bundle `react-native-webview`. `SelectableTextView` never reads it,
  so the component works there; the default export is `null` in those
  environments. Verified in Expo Go and in a prebuilt app, on iOS and Android.

### Added

- **Your own selection menu** in the API reference: `webViewProps.menuItems` and
  `onCustomMenuSelection` reach `react-native-webview` untouched, so the native
  menu can drive the ref's highlight methods.
- The README opens with badges and an _Is this the right library?_ table.

## [1.0.0] - 2026-09-14

Initial release.

### Added

- `SelectableTextView`: renders an HTML string inside `react-native-webview` on
  iOS and Android, with native text selection. Web is not supported.
- Persistent highlights backed by Rangy. Named highlighters style them as
  `background-color`, `text-decoration-color`, `outline-color`, or
  `background-image`, with an optional entrance or ambient animation.
  `onHighlightsChange` serializes them and the `highlights` prop restores them.
- Ref methods to highlight and unhighlight the selection, optionally behind an
  async validation; remove a highlight by id or clear them all; focus and
  unfocus a highlight; toggle highlight visibility; and read the selected text
  and the highlight data.
- Callbacks for selection changes, highlight taps (with the tapped highlight's
  position), links, visibility changes, and errors with a typed `code`.
- A bridge for custom actions: `evaluateJavaScript` runs a script in the page
  and resolves with its result, and `window.SelectableText.postMessage` sends
  page messages to `onCustomMessage`.
- Font helpers (`googleFonts()`, `mergeFonts()`), ignored elements, and viewport
  zoom options.

[unreleased]: https://github.com/majornutcracker/react-native-selectable-text/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/majornutcracker/react-native-selectable-text/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/majornutcracker/react-native-selectable-text/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/majornutcracker/react-native-selectable-text/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/majornutcracker/react-native-selectable-text/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/majornutcracker/react-native-selectable-text/releases/tag/v1.0.0
