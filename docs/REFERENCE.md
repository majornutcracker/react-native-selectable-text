# API Reference

`SelectableTextView` renders an HTML string inside a WebView with native text
selection, [Rangy](https://github.com/timdown/rangy)-backed highlights, and a
message bridge to React Native.

This page is the full surface. For a quick start see the
[README](../README.md); for a runnable demo see [`example/`](https://github.com/majornutcracker/react-native-selectable-text/tree/main/example).

## Props

| Prop                 | Description                                                                                                                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content`            | The HTML string rendered inside the WebView. Changing it does **not** re-render — remount the component to show new content.                                                                                                                                                             |
| `css`                | Injected styles for layout and typography. Declared after the generated highlighter classes, so your rules win on equal specificity and can restyle or re-animate a highlight.                                                                                                           |
| `fonts`              | WebView font setup via `googleFonts()`, `mergeFonts()`, or custom `preconnect`, `stylesheets`, and `@font-face` rules. Multiple families are supported in a single config.                                                                                                               |
| `highlighters`       | Named highlight classes. A name must be a valid CSS class name — letters, digits, `-` and `_`, not starting with a digit — and invalid names are dropped with a console warning.                                                                                                         |
| `initialHighlights`  | Serialized highlights painted when the view mounts — the string a previous session stored. Read once; changing it later does nothing (the view warns) and `setHighlights()` is how a mounted view is updated.                                                                            |
| `highlighterOptions` | `ignoredElements` — tags or selectors such as `a`, `sup`, `.ignored`. Ignored nodes skip the visible highlight but stay selectable and copyable.                                                                                                                                         |
| `options`            | Viewport zoom: `userScalable`, `initialScale`, `maximumScale`.                                                                                                                                                                                                                           |
| `webViewProps`       | Pass-through to `react-native-webview`. `javaScriptEnabled`, `source`, and `onShouldStartLoadWithRequest` are owned by the component and cannot be overridden. `menuItems` and `onCustomMenuSelection` pass through untouched — see [Your own selection menu](#your-own-selection-menu). |

## Callbacks

| Callback                                     | Fires when                                                                                                                                                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onTextSelectionChange(text)`                | The selection changes. Receives the selected text, or `""` when the selection is cleared.                                                                                                                        |
| `onHighlightsChange(highlights, items)`      | The serialized highlight payload changes. Receives the payload to persist, plus the `HighlightData[]` it contains — no `getAllHighlightsData()` round-trip needed.                                               |
| `onHistoryChange(state)`                     | The undo history moves. Receives `{ change, history, historyIndex, length, canUndo, canRedo }`, so undo and redo controls can enable themselves without tracking anything — see [Undo and redo](#undo-and-redo). |
| `onLink(url)`                                | A link is tapped. Without this prop, `http(s)` URLs open through `Linking`.                                                                                                                                      |
| `onError(error)`                             | The WebView SDK reports an error: `{ code, message, details }`. Try highlighting over an existing highlight for `overlapping_highlight`, or with no selection for `empty_selection`.                             |
| `onHighlightPressed(highlight)`              | A highlight is tapped. Receives `{ id, name, text, rect, rects }`. Return a `className` to style the pressed highlight (define it in `css`), or return nothing to leave it unstyled.                             |
| `onHighlightsVisibilityStateChange(visible)` | Highlight visibility changes. Receives `true` when visible, `false` when hidden.                                                                                                                                 |
| `onCustomMessage(message)`                   | A script in the page calls `window.SelectableText.postMessage(type, data)`. Receives `{ type, data }`. See [Bridging custom actions](#bridging-custom-actions).                                                  |

A callback that throws is caught and logged rather than crashing the bridge, so
a bug in your handler will not take the component down with it.

### Where a tapped highlight is

`onHighlightPressed` reports the geometry of the highlight along with it, so a
popover can be anchored without measuring anything yourself:

```tsx
const [menu, setMenu] = useState<HighlightRect | null>(null);

<View>
  <SelectableTextView
    onHighlightPressed={(highlight) => {
      setMenu(highlight.rect);
      return "focused";
    }}
    ...
  />
  {menu && (
    <View
      style={{
        position: "absolute",
        left: menu.x,
        top: menu.y + menu.height, // just under the highlight
      }}
    >
      ...
    </View>
  )}
</View>;
```

`rect` is the box around the whole highlight; `rects` has one box per line it
covers, for drawing something that has to follow the text rather than sit beside
it. Both are in points from the top-left of the WebView — the same frame as the
component's own layout, so they can be used directly on an overlay positioned
over it. Zoom is already applied, so a pinched-in page reports where the text
actually appears rather than where it sits in the layout.

They are a **snapshot** taken when the tap happened. Scrolling or zooming
afterwards does not update them, so dismiss or re-anchor whatever you placed:
`onTextSelectionChange` and a `webViewProps.onScroll` handler are the usual
hooks for that.

### Restoring, replacing and undoing

Highlights travel as one serialized string. Persist what `onHighlightsChange`
reports, and hand it back on the next mount:

```tsx
const [saved, setSaved] = useState<string | undefined>(undefined);

useEffect(() => {
  AsyncStorage.getItem("highlights").then((value) => setSaved(value ?? ""));
}, []);

// Wait for storage: the prop is read once, when the view mounts.
if (saved === undefined) return <Spinner />;

<SelectableTextView
  initialHighlights={saved}
  onHighlightsChange={(serialized, items) => {
    AsyncStorage.setItem("highlights", serialized);
    setItems(items); // ids, names and text — already resolved
  }}
/>;
```

To replace the highlights of a view that is already on screen, call the ref:

```tsx
ref.current?.setHighlights(payload); // "" clears them
```

Those are the two halves on purpose. `initialHighlights` is the document the
reader opens with; `setHighlights` is every change after that. A single prop
doing both is what made restoring unpredictable: it had to guess which values
were genuine and which were the view's own report coming back around.

#### Undo and redo

The page keeps the history itself — every content change, in order — and reports
where it stands:

```tsx
const [history, setHistory] = useState({ canUndo: false, canRedo: false });

<SelectableTextView onHistoryChange={setHistory} ... />;

<Button title="Undo" disabled={!history.canUndo} onPress={() => ref.current?.undo()} />
<Button title="Redo" disabled={!history.canRedo} onPress={() => ref.current?.redo()} />
```

`onHistoryChange` receives `{ change, history, historyIndex, length, canUndo,
canRedo }`. `change` says what moved: `"HISTORY"` when an entry was recorded or
the history was reset, `"HISTORY_INDEX"` when `undo()` or `redo()` stepped
through the entries it already had. `history` carries the entries themselves, so
a consumer that mirrors them does not have to ask;
[`getHistory()`](#reading-state) reads the same state outside of a change.

What is recorded: highlighting, unhighlighting, clearing and `setHighlights`.
Showing, hiding and focusing are not — they are presentation, and an undo that
un-hid highlights would surprise. Making a new change after an undo drops what
was ahead, the way an editor does, and undoing with nothing behind you does
nothing at all: `onHistoryChange` is how a button knows to disable itself, so
there is no error to handle.

Stepping through the history does **not** replay a highlight's entrance
animation. An undo restores something the reader has already seen; announcing it
as new would misread the gesture.

Each step still reports through `onHighlightsChange`, because an undo does
change what the content holds — whatever you persist stays in step with it.

The history holds the last 50 states, oldest dropped first: every entry is a
whole serialized payload, so it is bounded on purpose.

```tsx
ref.current?.clearHistory(); // start again from what is on screen
```

`clearHistory()` forgets every recorded state and restarts from the current one:
nothing to undo, nothing to redo, highlights untouched. It is for the moments
after which going back makes no sense — the highlights were just saved, or a
screen handed the view a different set to work on.

#### When a payload is refused

`setHighlights` (and `initialHighlights`) take a string this view produced. Hand
it something else and it is refused through `onError` with `invalid_highlight`,
**without touching the highlights already on screen** — a bad payload costs the
reader nothing. `details` carries the reason, including the offending string.

## Ref API

### Highlighting

- **`highlightSelection(name?, options?)`** — applies a highlighter to the cached selection.
- **`highlightSelectionWithValidation(validation, name?, options?)`** — highlights only if `validation(text)` returns, or resolves to, `true`.

The selection is pinned when the text is read, so an async `validation` cannot
end up highlighting whatever the reader selected while it was running: a
selection that moved on is refused with `selection_changed`. The returned
promise never rejects — a timeout, an unmount, or a `validation` that throws is
reported through `onError` instead, so a call site does not need its own
`catch`.

- **`unhighlightSelection(options?)`** — removes the highlights the cached selection touches.
- **`unhighlightById(id, options?)`** — removes a single highlight.
- **`clearHighlights()`** — removes every highlight from the content, immediately.
- **`setHighlights(highlights)`** — replaces every highlight with the ones a serialized payload describes; `""` clears them. A payload that does not belong to this content is reported through `onError` with `invalid_highlight`.
- **`undo()`** / **`redo()`** — step through the history described in [Undo and redo](#undo-and-redo).
- **`clearHistory()`** — forget the recorded states and start again from what is on screen.

#### `UnhighlightOptions`

`unhighlightById` and `unhighlightSelection` take `{ className?, delay? }`, which
plays an exit animation before the highlight goes: the class is added, the wait
happens inside the WebView, and the nodes are deleted when it ends.

```tsx
// css: .highlight-exit { animation: fadeOut 400ms forwards; }
ref.current?.unhighlightById(id, { className: "highlight-exit", delay: 400 });
ref.current?.unhighlightSelection({ className: "highlight-exit", delay: 400 });
```

There is no timer to cancel on unmount. Highlights already staged for removal
are left alone rather than restarted, so their animations keep their original
schedule, and one that disappears during the wait — a `clearHighlights()`, a
restore — is not reported as an error.

The class is taken back off in the same tick as the removal, so `forwards` is
safe to use and the animation's end state is never stranded on the text.

`unhighlightSelection` resolves which highlights the selection touches
**immediately** and drops the selection right away, so the animation is not left
behind the platform's selection UI; what gets removed when the wait ends is that
set, not whatever happens to be selected by then.

Note that anything which replaces the whole highlight set — `clearHighlights()`,
or a new payload through `setHighlights()` — cancels a running exit animation and
removes the highlights at once. State that resets eagerly on its own will
therefore outrun an animation you staged.

#### `SelectionActionOptions`

The three methods that act on a selection accept `{ keepSelection?: boolean }`.

By default the selection is **cleared** once the action completes, which also
dismisses the platform's selection UI. This matters most on iOS, where the
selection handles and the callout menu would otherwise stay on top of the
highlight that was just created — hiding it, and any entrance animation it has.

Pass `{ keepSelection: true }` when you want to chain another action on the same
text, for example highlighting and then copying from a menu that stays open.

```ts
ref.current?.highlightSelection("yellow", { keepSelection: true });
```

### Reading state

- **`getSelectedText(): Promise<string>`** — the cached selected text.
- **`getHighlights(): Promise<string>`** — the serialized highlights string, for storage, `initialHighlights` or `setHighlights()`.
- **`getAllHighlightsData(): Promise<HighlightData[]>`** — an array of `{ id, name, text }` for every highlight.
- **`getHighlightsVisibilityState(): Promise<boolean>`** — `true` when highlights are visible.
- **`getHistory(): Promise<HistoryState>`** — the recorded states and where the content sits among them: `{ history, historyIndex, length, canUndo, canRedo }`.

### Focus and visibility

- **`focusHighlight(id, className?, options?)`** — scrolls to a highlight and applies a focus style. Pass a `className` to style it through `css`, or omit it for the default focus style. `options` controls the scroll:

```ts
type FocusHighlightOptions = {
  scroll?: boolean; // default true — false applies the style in place
  block?: "start" | "center" | "end" | "nearest"; // default "center"
  behavior?: "smooth" | "auto"; // default "smooth"
  offset?: number; // default 0 — px covered at the top of the viewport
};
```

`offset` is the height of a band covered at the top of the viewport, such as a
floating header. The highlight is aligned within the viewport minus that band, so
it never lands underneath it. With `block: "nearest"` a highlight hidden behind
the band counts as off-screen and is scrolled into view.

```ts
// Default: centered, smooth.
ref.current?.focusHighlight(id);

// Pinned below a 96px floating header.
ref.current?.focusHighlight(id, "focused", { block: "start", offset: 96 });

// Style it without moving the content.
ref.current?.focusHighlight(id, "focused", { scroll: false });
```

- **`unfocusHighlight()`** — removes the focus style without deleting the highlight.
- **`toggleHighlightsVisibility(): Promise<boolean>`** — hides or shows highlights without deleting them; resolves with the new visibility. On a document with no highlights it still flips the state, so a toggle control stays in sync.

> **`onHighlightPressed` vs `focusHighlight`** — a class name returned from
> `onHighlightPressed` is applied **in place, without scrolling**, since the user
> is already looking at what they tapped. Call `focusHighlight(id, className?)`
> when you also want the content scrolled to the highlight.

### Running your own script

- **`evaluateJavaScript<T>(script, options?): Promise<T>`** — runs `script` in
  the page and resolves with what it returns. This is the escape hatch for
  anything the ref does not cover; see
  [Bridging custom actions](#bridging-custom-actions).

Promise-returning methods reject after a 2 second timeout (`evaluateJavaScript`
accepts its own), and reject with `"Component unmounted"` if the view goes away
while a call is in flight. Calls made before the WebView finishes loading are
queued and flushed on load rather than dropped.

## Your own selection menu

The menu that pops up over a selection is the WebView's, and
`react-native-webview` already lets you replace its items. `webViewProps` passes
`menuItems` and `onCustomMenuSelection` straight through, so the menu stays
native on both platforms and the ref decides what each item does.

```tsx
const ref = React.useRef<SelectableTextViewRef>(null);

<SelectableTextView
  ref={ref}
  content={html}
  highlighters={highlighters}
  webViewProps={{
    menuItems: [
      { key: "highlight", label: "Highlight" },
      { key: "unhighlight", label: "Unhighlight" },
      { key: "copy", label: "Copy" },
    ],
    onCustomMenuSelection: (event) => {
      switch (event.nativeEvent.key) {
        case "highlight":
          ref.current?.highlightSelection("yellow");
          break;
        case "unhighlight":
          ref.current?.unhighlightSelection();
          break;
        case "copy":
          Clipboard.setString(event.nativeEvent.selectedText);
          break;
      }
    },
  }}
/>;
```

The ref methods act on the **cached** selection, so the handler does not have to
hand the text back; `event.nativeEvent.selectedText` is there for the cases that
need the string itself — copying, sharing, translating, or asking a server
whether the passage may be highlighted.

An empty `menuItems` array suppresses the menu entirely, and `suppressMenuItems`
(iOS) drops individual system items such as `lookup` or `share`.

The selection is dropped once the action completes, which dismisses the iOS
callout so a highlight's entrance animation is visible; pass
`{ keepSelection: true }` to chain another action on the same text — see
[`SelectionActionOptions`](#selectionactionoptions).

[`example/src/screens/Reader.tsx`](https://github.com/majornutcracker/react-native-selectable-text/blob/main/example/src/screens/Reader.tsx)
wires this up with a validated variant as well, and lets you pick which
highlighter the menu applies.

## Highlighters

Each `Highlighter` has a unique `name` — used as the class name of the element
wrapping the selection, so `css` rules under that class apply to every highlight
of that kind — and an `options` object. If names are repeated, the last one wins.

```ts
type Highlighter = {
  name: string;
  options:
    | { type: "background-color"; color: string; animation?: AnimationOptions }
    | {
        type: "text-decoration-color";
        color: string;
        line?: "underline" | "overline" | "line-through";
        thickness?: number;
        offset?: number;
        style?: "solid" | "double" | "dotted" | "dashed" | "wavy";
        animation?: AnimationOptions;
      }
    | {
        type: "outline-color";
        color: string;
        width?: number;
        offset?: number;
        style?:
          | "solid"
          | "dotted"
          | "dashed"
          | "double"
          | "groove"
          | "ridge"
          | "inset"
          | "outset";
        animation?: AnimationOptions;
      }
    | {
        type: "background-image";
        image: string;
        position?: string;
        repeat?: string;
        size?: string;
        animation?: AnimationOptions;
      };
};
```

The default, when `highlighters` is omitted, is a single
`{ name: "yellow-highlighter", options: { type: "background-color", color: "yellow" } }`.

### Animations

Every option type accepts an optional `animation`. The `@keyframes` rule is
injected as-is, so it can be shared by several highlighters.

`iterationCount` decides what kind of animation it is:

- **A number** makes it an **entrance**. It plays once when the highlight
  appears — created from a selection, or restored through `initialHighlights`
  — and never again. Focusing and unfocusing the highlight, tapping elsewhere,
  hiding and showing highlights, or cancelling an exit do not replay it. If the
  highlight is focused or starts exiting while its entrance is still running,
  the entrance stops there.
- **`"infinite"`** makes it **ambient**: it runs for as long as the highlight
  exists. Because it lives on the highlighter's own class, anything that
  replaces the element's `animation` for a moment — a focus class with its own
  animation, or hiding the highlights — restarts it from the beginning
  afterwards.

Entrances are applied through an internal state class that the runtime removes
once the animation ends. Target `.<name>` in your `css`, not that class.

```ts
type AnimationOptions = {
  name: string; // keyframes name
  keyframesCss: string; // the @keyframes rule, injected as-is
  duration: string; // e.g. "2s"
  timingFunction:
    "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | string;
  iterationCount: number | "infinite";
};
```

```ts
const highlighters: Highlighter[] = [
  {
    name: "pulse",
    options: {
      type: "background-color",
      color: "#ffe08a",
      animation: {
        name: "pulse-anim",
        duration: "1.5s",
        timingFunction: "ease-in-out",
        iterationCount: "infinite",
        keyframesCss: `@keyframes pulse-anim { 0% { opacity: 1; } 50% { opacity: .6; } 100% { opacity: 1; } }`,
      },
    },
  },
];
```

## Fonts

The `fonts` prop is injected into the WebView head. Build it by hand or with the
exported helpers:

```ts
import {
  googleFonts,
  mergeFonts,
  fontsToCSS,
  fontsToHeadMarkup,
} from "@majornutcracker/react-native-selectable-text";

const fonts = googleFonts({
  families: [{ family: "Inter", weights: "400;700" }],
});
// <SelectableTextView fonts={fonts} ... />
```

- **`googleFonts({ families })`** — builds `preconnect` + stylesheet entries for
  one Google Fonts request covering every family.
- **`mergeFonts(...configs)`** — combines several configs, de-duplicating
  entries.
- **`fontsToCSS(fonts)`** / **`fontsToHeadMarkup(fonts)`** — the raw `@font-face`
  CSS and the head markup, if you need to inspect or inline them yourself.

## Styling highlights

Each highlighter's `options` are compiled into a `.<name>` rule, and the `css`
prop is injected **after** those rules. Both are single-class selectors, so
yours wins by being declared later — which is what makes an exit animation
possible: a rule of yours targeting the highlight can override the `animation`
the highlighter itself sets.

The one exception is the hidden state used by `toggleHighlightsVisibility()`,
which is marked `!important` and cannot be overridden.

An exit class is **added to** the highlighter's class rather than replacing it,
so the span carries both. A compound selector therefore outranks the
highlighter's own rule, which is what lets each highlighter leave differently —
releasing the property its type actually set — without any of it reaching the
API:

```css
.amber-marker.highlight-exit {
  animation: amberDrain 400ms forwards;
}
.mint-frame.highlight-exit {
  animation: mintRelease 400ms forwards;
}
```

Classes the SDK adds to a highlight — a focus style, a staged exit — are always
removed before the highlight itself is, because a span left carrying an extra
class cannot be unwrapped and would keep whatever that class styles.

## Ignored elements

`highlighterOptions.ignoredElements` defaults to `["a", "sup", "sub"]`. Ignored
nodes are skipped by the _visible_ highlight while remaining selectable and
copyable, which is what you want for links and for notation like H<sub>2</sub>O
or E = mc<sup>2</sup> sitting inside a sentence.

Any CSS selector works, so `.ignored` on a wrapper element opts a whole block
out of visible highlighting.

A selection that merely crosses ignored content is highlighted around it. One
that lies **entirely** inside it has nothing left to show, so no highlight is
kept — it is not counted, listed by `getAllHighlightsData()`, or serialized, and
`onError` reports `highlight_fully_ignored` so you can tell the user why nothing
happened.

The `text` in highlight data is exactly what is painted, so it leaves ignored
content out: a highlight across `E = mc<sup>2</sup>` reads `"mc"`.

## Error codes

`onError` receives a `SelectableTextViewError` with `{ code, message, details }`.
The possible `code` values are:

| Code                                                               | Meaning                                                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `empty_selection`                                                  | A highlight was requested with no active selection.                                                        |
| `overlapping_highlight`                                            | The selection overlaps an existing highlight.                                                              |
| `highlight_not_found`                                              | No highlight matches the given id.                                                                         |
| `highlight_fully_ignored`                                          | The selection lay entirely inside ignored content, so the highlight had no visible text and was discarded. |
| `invalid_range`, `invalid_class_applier`, `invalid_highlight`      | Rangy rejected the range, highlighter class, or highlight payload.                                         |
| `initialization_error`, `bridge_message_error`                     | The WebView SDK failed to start, or a bridge message was malformed.                                        |
| `failed_to_highlight_selection`, `failed_to_unhighlight_selection` | The highlight or unhighlight operation failed.                                                             |
| `failed_to_clear_highlights`, `failed_to_unhighlight_by_id`        | The removal operation failed.                                                                              |
| `failed_to_focus_highlight`                                        | Focusing a highlight failed.                                                                               |
| `selection_changed`                                                | The selection moved while an async validation ran, so the highlight was refused.                           |
| `unknown`                                                          | An error that does not match any of the above.                                                             |

## Bridging custom actions

The ref and the callbacks cover highlighting. Anything else — reading or setting
the scroll position, reacting to a button inside your own HTML, measuring an
element — goes through a two-way bridge, so you never need the WebView itself.

| Direction           | Use                                                                 |
| ------------------- | ------------------------------------------------------------------- |
| React Native → page | `ref.current.evaluateJavaScript(script, options?)`                  |
| Page → React Native | `window.SelectableText.postMessage(type, data)` + `onCustomMessage` |

### React Native → page: `evaluateJavaScript`

`script` is the body of an async function: it can `await`, and whatever it
`return`s becomes the resolved value.

```ts
const heading = await ref.current?.evaluateJavaScript<string>(
  "return document.querySelector('h1')?.textContent ?? '';"
);
```

- **The result crosses as JSON.** Return plain data. A DOM node, a function, or
  a circular structure rejects the promise with a message saying so.
- **Failures reject.** A syntax error or an error the script throws rejects with
  the page's own message.
- **Calls are queued until the page has loaded**, so calling on mount is safe.
- **`timeout`** defaults to 2 seconds and counts from the call, _including_ the
  time spent waiting for the page to load. A script that also awaits something
  needs a timeout that covers both.
- **A value you interpolate into the script is code, not data.** Pass numbers
  through `Number()` and anything else through `JSON.stringify()`, so a value
  can never end the expression it sits in.

#### Example: restoring a scroll position

Text reflows when web fonts arrive, so wait for them before scrolling. Capturing
the position needs no bridge at all: `webViewProps.onScroll` already reports
`contentOffset`, `contentSize`, and `layoutMeasurement`.

```tsx
useEffect(() => {
  const view = ref.current;
  if (!view) return;
  const fraction = Number(savedFraction) || 0;

  view
    .evaluateJavaScript(
      `
      if (document.fonts) await document.fonts.ready;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0) window.scrollTo(0, ${fraction} * max);
      `,
      { timeout: 6000 }
    )
    .catch(() => {}) // a slow or failed restore must still show the page
    .finally(() => setReady(true));
}, []);
```

The [example app](https://github.com/majornutcracker/react-native-selectable-text/tree/main/example) does exactly this, in `useScrollRestore`.

### Page → React Native: `window.SelectableText.postMessage`

Every page gets `window.SelectableText`. It is defined in `<head>`, so a script
inside your `content` can use it the moment it runs:

```tsx
<SelectableTextView
  ref={ref}
  content={`
    <article>…</article>
    <button id="share" data-title="The Anatomy of Attention">Share</button>
    <script>
      document.getElementById("share").addEventListener("click", function (e) {
        window.SelectableText.postMessage("share", {
          title: e.currentTarget.dataset.title,
        });
      });
    </script>
  `}
  onCustomMessage={({ type, data }) => {
    if (type === "share") {
      Share.share({ message: String((data as { title?: string }).title) });
    }
  }}
/>
```

- `type` must be a non-empty string and `data` JSON-serializable. Getting either
  wrong throws inside the page, where your web inspector shows it.
- `onCustomMessage` only ever receives these messages. `webViewProps.onMessage`
  receives them too, but mixed in with the module's own traffic.
- **Treat `data` as untrusted.** Any script in the page can call `postMessage`,
  including one that arrived as part of `content`. Validate it before acting on
  it.

### Which one to use

- The action starts **in React Native** — on mount, from a native button:
  `evaluateJavaScript`.
- The action starts **in the page** — a tap, an observer, a timer in your HTML:
  `postMessage` with `onCustomMessage`.
- Code that must run **on every load, before the content**:
  `webViewProps.injectedJavaScriptBeforeContentLoaded`, which is not part of the
  bridge.

The module's internal globals (`window.__MNST__`, `rangy`) are not part of the
API and can change in any release. Build on the bridge instead.

## Security note

`content` is rendered as-is; the module does not sanitize it. If the HTML comes
from an untrusted source, sanitize it before passing it in. See
[SECURITY.md](https://github.com/majornutcracker/react-native-selectable-text/blob/main/SECURITY.md) for the full trust boundary.
