# @majornutcracker/react-native-selectable-text

[![npm](https://img.shields.io/npm/v/@majornutcracker/react-native-selectable-text.svg)](https://www.npmjs.com/package/@majornutcracker/react-native-selectable-text)
[![downloads](https://img.shields.io/npm/dw/@majornutcracker/react-native-selectable-text.svg)](https://www.npmjs.com/package/@majornutcracker/react-native-selectable-text)
[![license](https://img.shields.io/npm/l/@majornutcracker/react-native-selectable-text.svg)](./LICENSE)
![platforms](https://img.shields.io/badge/platforms-iOS%20%7C%20Android-lightgrey.svg)

Expo module for **iOS and Android** built on `react-native-webview`. It renders
HTML with advanced text selection, custom context menus, and persistent
highlighting via [Rangy](https://github.com/timdown/rangy). Serialize, sync, restore selections and more

Web is not supported.

> **[Try it in Expo Go →](https://snack.expo.dev/@majornutcracker/selectabletext)**
> Select a passage, pick a color from the native menu, clear the highlights and
> bring them back. No install, no build.

## Is this the right library?

| You need                                                      | This module                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Highlights that survive a remount, a restart, or a new device | **Yes** — serialize them, store the string, pass it back                                 |
| Rich content: articles, chapters, anything already HTML       | **Yes** — you hand it HTML and CSS                                                       |
| Your own selection menu                                       | **Yes** — [native menu items](./docs/REFERENCE.md#your-own-selection-menu), your actions |
| A tap target on each highlight, with its position             | **Yes** — `onHighlightPressed` reports the rects                                         |
| Selection on a native `<Text>` tree                           | No — this renders a WebView                                                              |
| Web support                                                   | No — iOS and Android only                                                                |
| Selection or highlights inside a PDF                          | No                                                                                       |

## Demo

Basic usage from the [example app](https://github.com/majornutcracker/react-native-selectable-text/tree/main/example): selecting text, highlight
entrance and exit animations, the focus effect, and focusing and removing a
highlight.

<table>
  <tr>
    <th>iOS</th>
    <th>Android</th>
  </tr>
  <tr>
    <td>
      <img
        src="https://github.com/majornutcracker/react-native-selectable-text/raw/main/assets/ios.gif"
        width="280"
        alt="iOS: selecting text, highlighting it with an entrance animation, focusing a highlight, and removing it with an exit animation"
      />
    </td>
    <td>
      <img
        src="https://github.com/majornutcracker/react-native-selectable-text/raw/main/assets/android.gif"
        width="280"
        alt="Android: selecting text, highlighting it with an entrance animation, focusing a highlight, and removing it with an exit animation"
      />
    </td>
  </tr>
</table>

## Installation

In an Expo project, let the CLI pick the version that matches your SDK:

```sh
npx expo install @majornutcracker/react-native-selectable-text react-native-webview
```

Or install it directly, with whichever package manager the project uses:

```sh
npm install @majornutcracker/react-native-selectable-text
```

```sh
yarn add @majornutcracker/react-native-selectable-text
```

```sh
pnpm add @majornutcracker/react-native-selectable-text
```

```sh
bun add @majornutcracker/react-native-selectable-text
```

This is an Expo module. In bare React Native projects,
[install and configure `expo`](https://docs.expo.dev/bare/installing-expo-modules/)
first, then run `npx pod-install`. Expo Go needs nothing else: the native module
is optional and `react-native-webview` already ships inside it.

**Peer dependencies:** `expo`, `react`, `react-native`, and
`react-native-webview` `^13.16.1` (`>=13.16.1 <14`; v14 ships incompatible types).

## Quick start

```tsx
import * as React from "react";
import {
  SelectableTextView,
  SelectableTextViewRef,
  Highlighter,
} from "@majornutcracker/react-native-selectable-text";

const highlighters: Highlighter[] = [
  {
    name: "yellow-highlighter",
    options: { type: "background-color", color: "yellow" },
  },
];

export default function Screen({ saved }: { saved?: string }) {
  const ref = React.useRef<SelectableTextViewRef>(null);

  return (
    <SelectableTextView
      ref={ref}
      content="<h1>Hello</h1><p>Select some text and highlight it.</p>"
      css=".content { padding: 16px; font-size: 18px; }"
      highlighters={highlighters}
      // What a previous session stored. Read once, when the view mounts.
      initialHighlights={saved}
      onHighlightsChange={(highlights) => {
        // Persist this serialized string to restore highlights later.
        console.log(highlights);
      }}
      onHighlightPressed={(highlight) => {
        console.log("pressed", highlight.id, highlight.name, highlight.text);
      }}
    />
  );
}

// From anywhere, with the ref:
// ref.current?.highlightSelection("yellow-highlighter");
// ref.current?.setHighlights(payload); // replace them; "" clears
// ref.current?.undo();                 // and redo(), and clearHistory()
```

Store the string `onHighlightsChange` reports, hand it back through
`initialHighlights` on the next mount, and the highlights come back where the
reader left them. On a view that is already on screen, `setHighlights()`
replaces them and `undo()` / `redo()` walk a history the view keeps for you —
see the [API reference](./docs/REFERENCE.md#restoring-replacing-and-undoing).

## Documentation

- **[API reference](./docs/REFERENCE.md)** — every prop, callback, and ref
  method, plus highlighter styles and animations, fonts, error codes, ignored
  elements, and the content trust boundary.
- **[`example/`](https://github.com/majornutcracker/react-native-selectable-text/tree/main/example)** — a runnable reader app with three documents, each
  a different HTML/CSS design, showing animated highlight entrances and exits.
  Open the native projects with `yarn open:ios` / `yarn open:android`.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](https://github.com/majornutcracker/react-native-selectable-text/blob/main/CONTRIBUTING.md) for setup,
workflow, and commit conventions.

Hit a blocker, need a feature, or found a bug? [Open an issue](https://github.com/majornutcracker/react-native-selectable-text/issues)
— we follow them closely and keep improving the library.

## License

MIT — see [LICENSE](./LICENSE).

This package bundles [Rangy](https://github.com/timdown/rangy) (© Tim Down, MIT).
See [THIRD-PARTY-NOTICES.md](./docs/THIRD-PARTY-NOTICES.md).
