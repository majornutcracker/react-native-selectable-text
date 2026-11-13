export type Highlights = string;

export type HTMLString = string;

export type CSSString = string;

export type SelectableTextViewFontPreconnect = {
  href: string;
  crossOrigin?: boolean;
};

export type SelectableTextViewFontStylesheet = {
  href: string;
  crossOrigin?: "anonymous" | "use-credentials";
};

export type SelectableTextViewFontFace = {
  fontFamily: string;
  src: string | string[];
  fontWeight?: string | number;
  fontStyle?: "normal" | "italic" | "oblique";
  fontDisplay?: "auto" | "block" | "swap" | "fallback" | "optional";
  fontStretch?: string;
  unicodeRange?: string;
};

export type HighlightData = {
  id: string;
  name: HighlighterName;
  /**
   * Exactly the highlighted text. Text inside `ignoredElements` is never
   * painted, so it is left out: a highlight across `E = mc<sup>2</sup>` reads
   * `"mc"`.
   */
  text: string;
};

/**
 * A box measured inside the WebView, in points from the top-left of the
 * WebView itself — the same frame as the component's own layout, so the values
 * drop straight into an absolutely positioned overlay.
 *
 * Zoom is already accounted for, so a pinched-in page reports where the text
 * actually sits on screen rather than where it sits in the layout.
 */
export type HighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * What {@link SelectableTextViewPropsBase.onHighlightPressed} receives: the
 * highlight, plus where it is on screen at the moment it was tapped.
 */
export type PressedHighlightData = HighlightData & {
  /**
   * The box around the whole highlight, covering every line it spans.
   * Use it to anchor a popover or a tooltip to the highlight.
   */
  rect: HighlightRect;
  /**
   * One box per line the highlight covers, for drawing something that has to
   * follow the text itself rather than sit next to it. A highlight on a single
   * line reports one box, identical to `rect`.
   */
  rects: HighlightRect[];
};

export type GoogleFontFamily = {
  family: string;
  weights?: string;
  italic?: boolean;
};

/**
 * Multiple fonts are supported: add several stylesheets, several @font-face entries,
 * or combine configs with mergeFonts(). Use googleFonts({ families: [...] }) for
 * multiple Google families in a single request.
 */
export type SelectableTextViewFonts = {
  preconnect?: SelectableTextViewFontPreconnect[];
  stylesheets?: SelectableTextViewFontStylesheet[];
  faces?: SelectableTextViewFontFace[];
};

export type HighlighterName = string;

export type AnimationOptions = {
  keyframesCss: string;
  name: string;
  duration: string;
  timingFunction:
    "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | string;
  iterationCount: number | "infinite";
};

export type HighlighterType =
  | "background-color"
  | "text-decoration-color"
  | "outline-color"
  | "background-image";

export type HighlighterBackgroundColorOption = {
  type: "background-color";
  color: string;
  animation?: AnimationOptions;
};

export type HighlighterTextDecorationColorOption = {
  type: "text-decoration-color";
  color: string;
  line?: "underline" | "overline" | "line-through";
  thickness?: number;
  offset?: number;
  style?: "solid" | "double" | "dotted" | "dashed" | "wavy";
  animation?: AnimationOptions;
};

export type HighlighterOutlineColorOption = {
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
};

export type HighlighterBackgroundImageOption = {
  type: "background-image";
  image: string;
  position?: "left" | "center" | "right" | "top" | "bottom" | string;
  repeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y" | string;
  size?: "auto" | "cover" | "contain" | string;
  animation?: AnimationOptions;
};

export type Highlighter = {
  /**
   * A unique name for the highlighter.
   * It is used as the className of the tag that wraps the selection,
   * so in the css property you can add more styles than just the background color.
   * If names are repeated, the last one will be chosen.
   * @default "yellow-highlighter"
   */
  name: HighlighterName;
  options:
    | HighlighterBackgroundColorOption
    | HighlighterTextDecorationColorOption
    | HighlighterOutlineColorOption
    | HighlighterBackgroundImageOption;
};

/**
 * Options for the ref methods that act on the current text selection.
 */
export type SelectionActionOptions = {
  /**
   * Keep the text selected after the action completes.
   *
   * Defaults to `false`: the selection is cleared, which also dismisses the
   * platform's selection UI — on iOS the handles and the callout menu would
   * otherwise stay on top of the highlight that was just created, hiding it and
   * any entrance animation it has.
   *
   * Set this to `true` when you want to chain another action on the same text,
   * for example highlighting and then copying it from a menu that stays open.
   *
   * @default false
   */
  keepSelection?: boolean;
};

export type HighlighterOptions = {
  /**
   * CSS selectors for elements excluded from visible highlights (e.g., 'a', '.ignored').
   * Text inside ignored elements remains selectable and copyable.
   * @default ['a','sub','sup']
   */
  ignoredElements?: string[];
};

export type SelectableTextViewOptions = {
  /**
   * A boolean indicating whether to enable the user scaling of the content.
   * @default true
   */
  userScalable?: boolean;
  /**
   * A unsigned number indicating the initial scale of the content.
   * @default 1
   */
  initialScale?: number;
  /**
   * A unsigned number indicating the maximum scale of the content.
   * @default 2.5
   */
  maximumScale?: number;
};

/**
 * Options shared by the methods that remove highlights one at a time:
 * {@link SelectableTextViewRef.unhighlightById} and
 * {@link SelectableTextViewRef.unhighlightSelection}.
 */
export type UnhighlightOptions = {
  /**
   * A className added to the highlight before it is removed, so an exit
   * animation defined in the `css` prop can play. Pair it with `delay`.
   */
  className?: string;
  /**
   * Milliseconds to wait before the highlight is actually removed. Keep it in
   * sync with the duration of the animation on `className`.
   *
   * The wait happens inside the WebView, so there is no timer to track or
   * cancel on unmount. A highlight already staged for removal is left alone
   * rather than restarted, and one that disappears during the wait (a
   * `clearHighlights()`, a restore) is not reported as an error.
   * @default 0
   */
  delay?: number;
};

/**
 * Scroll behaviour used by {@link SelectableTextViewRef.focusHighlight}.
 */
export type FocusHighlightOptions = {
  /**
   * A boolean indicating whether to scroll the content to the highlight.
   * Set it to false to apply the focus style in place.
   * @default true
   */
  scroll?: boolean;
  /**
   * Where the highlight is aligned within the viewport once scrolled.
   * "nearest" only scrolls when the highlight is outside the viewport.
   * @default "center"
   */
  block?: "start" | "center" | "end" | "nearest";
  /**
   * The scrolling animation.
   * @default "smooth"
   */
  behavior?: "smooth" | "auto";
  /**
   * The height in pixels of a band covered at the top of the viewport, such as a
   * floating header. The highlight is aligned within the viewport minus that band,
   * so it is never left underneath it.
   * @default 0
   */
  offset?: number;
};

/**
 * Error codes emitted by the WebView SDK via {@link SelectableTextViewPropsBase.onError}.
 */
export type SelectableTextViewErrorCode =
  | "unknown"
  | "overlapping_highlight"
  | "empty_selection"
  | "invalid_range"
  | "invalid_class_applier"
  | "invalid_highlight"
  | "initialization_error"
  | "bridge_message_error"
  | "failed_to_highlight_selection"
  | "failed_to_unhighlight_selection"
  | "failed_to_clear_highlights"
  | "highlight_not_found"
  | "highlight_fully_ignored"
  | "selection_changed"
  | "failed_to_focus_highlight"
  | "failed_to_unhighlight_by_id";

export interface SelectableTextViewError extends Error {
  /**
   * A detailed description of the error
   */
  details?: string;
  /**
   * A message describing the error
   */
  message: string;
  /**
   * A code describing the error
   */
  code: SelectableTextViewErrorCode;
}

/**
 * What moved: a new entry was recorded (`HISTORY`), or the view stepped through
 * the entries it already had (`HISTORY_INDEX`, from `undo()` or `redo()`).
 */
export type HistoryChange = "HISTORY" | "HISTORY_INDEX";

/**
 * Where the undo history stands, reported on every change. It carries the whole
 * state — the entries included — so a consumer that mirrors the history does
 * not have to ask for it; {@link SelectableTextViewRef.getHistory} is for
 * reading it outside of a change.
 *
 * The entries are whole serialized payloads, which is why the history stops at
 * {@link HISTORY_LIMIT}: it bounds both the memory and this message.
 */
export type HistoryChangeEvent = HistoryState & {
  change: HistoryChange;
};

/** The whole history, as {@link SelectableTextViewRef.getHistory} returns it. */
export interface HistoryState {
  history: Highlights[];
  historyIndex: number;
  /**
   * How many entries the history holds, the state the view mounted with
   * included. It stops growing at {@link HISTORY_LIMIT}, dropping the oldest.
   */
  length: number;
  /** Whether {@link SelectableTextViewRef.undo} would do anything. */
  canUndo: boolean;
  /** Whether {@link SelectableTextViewRef.redo} would do anything. */
  canRedo: boolean;
}

export type SelectableTextViewRef = {
  /**
   * A function that applies highlighting to the current selection with a highlighter name previously defined in the highlighters property;
   * if it is not defined, the highlighting will not be applied.
   * @param name The name of the highlighter to apply to the selection.
   */
  highlightSelection: (
    name?: HighlighterName,
    options?: SelectionActionOptions
  ) => void;
  /**
   * A function that applies highlighting to the current selection with a highlighter name previously defined in the highlighters property;
   * if it is not defined, the highlighting will not be applied.
   * @param name The name of the highlighter to apply to the selection.
   * @param validation A callback function that will be called with the text of the selection if return true the highlighting will be applied.
   * @param options See {@link SelectionActionOptions}.
   */
  highlightSelectionWithValidation: (
    validation: (text: string) => boolean | Promise<boolean>,
    name?: HighlighterName,
    options?: SelectionActionOptions
  ) => Promise<void>;
  /**
   * A function that removes the highlighting from the current selection
   * @param options See {@link SelectionActionOptions} and {@link UnhighlightOptions}.
   * With a `delay`, the affected highlights are resolved immediately and the
   * selection is dropped right away, so the exit animation is not hidden behind
   * the platform's selection UI.
   */
  unhighlightSelection: (
    options?: SelectionActionOptions & UnhighlightOptions
  ) => void;
  /**
   * A function that removes all the highlights
   */
  clearHighlights: () => void;
  /**
   * Replaces every highlight in the content with the ones a serialized payload
   * describes — the way to restore after mount, where `initialHighlights` no
   * longer applies.
   *
   * An empty string clears them, which is what `clearHighlights()` does. A
   * payload that does not belong to this content is reported through `onError`
   * with `invalid_highlight` rather than throwing.
   * @param highlights A payload from `getHighlights()` or `onHighlightsChange`.
   * @throws js Error
   */
  setHighlights: (highlights: Highlights) => void;
  /**
   * Steps back to the previous set of highlights. Does nothing when there is
   * nothing to go back to — {@link SelectableTextViewProps.onHistoryChange}
   * reports when that is the case, so a button can disable itself.
   *
   * The history records content changes only: highlighting, unhighlighting,
   * clearing and `setHighlights`. Showing, hiding and focusing are left out,
   * since an undo that un-hid highlights would be a surprise.
   *
   */
  undo: () => void;
  /**
   * Steps forward again after an {@link SelectableTextViewRef.undo}. Making a
   * new change instead drops whatever was ahead, as editors do.
   */
  redo: () => void;
  /**
   * Forgets every recorded state and starts the history again from what the
   * content holds right now, the way it stood when the view mounted: nothing
   * to undo, nothing to redo, and the highlights left exactly as they are.
   *
   * For the moments after which going back makes no sense — the highlights
   * were just saved, or a screen handed the view a different set to work on.
   */
  clearHistory: () => void;
  /**
   * Reads the undo history itself — every payload it holds and which one the
   * content is on. {@link SelectableTextViewProps.onHistoryChange} already
   * reports whether a step exists, so this is for the callers that want the
   * entries: a history panel, a diff, a save of the whole session.
   * @throws js Error
   */
  getHistory: () => Promise<HistoryState>;
  /**
   * A promise that returns the selected text
   * @throws js Error
   * @returns The selected text
   */
  getSelectedText: () => Promise<string>;
  /**
   * A promise that returns the serialization of the current highlighting
   * @throws js Error
   * @returns The serialization of the current highlighting
   */
  getHighlights: () => Promise<Highlights>;
  /**
   * A function that focuses on a highlight by its id
   * Scrolls the content to the highlight and applies the focus style to it
   * You can add important! to the backgroundColor to ensure it overrides the default background color.
   * Or disable image background by setting the backgroundImage to none.
   * @param id The id of the highlight
   * @param className The className to apply to the highlight, you can styles for this className in the css property.
   * If omitted, a default focus style (a box-shadow) is applied.
   * @param options Scroll alignment, animation and offset. By default the highlight is
   * centered in the viewport with a smooth animation; pass `{ scroll: false }` to apply
   * the focus style without scrolling.
   */
  focusHighlight: (
    id: string,
    className?: string,
    options?: FocusHighlightOptions
  ) => void;
  /**
   * A function that removes the focus style from the currently focused highlight.
   * Use after `focusHighlight` to clear the visual focus state without removing the highlight.
   */
  unfocusHighlight: () => void;
  /**
   * A function that removes a highlight by its id
   * @param id
   * @param options Pass `{ className, delay }` to play an exit animation before
   * the highlight is removed. See {@link UnhighlightOptions}.
   */
  unhighlightById: (id: string, options?: UnhighlightOptions) => void;
  /**
   * A promise that returns all the highlights data
   * @throws js Error
   * @returns All the highlights data
   */
  getAllHighlightsData: () => Promise<HighlightData[]>;
  /**
   * A promise that returns whether highlights are currently visibility.
   * Initially, highlights are visible.
   * @throws js Error
   * @returns `true` if highlights are visible, `false` if hidden
   */
  getHighlightsVisibilityState: () => Promise<boolean>;
  /**
   * A promise that toggles highlight visibility without clearing highlights and each highlight data.
   * Initially, highlights are visible.
   * @throws js Error
   * @returns The new visibility state (`true` if visible, `false` if hidden)
   */
  toggleHighlightsVisibility: () => Promise<boolean>;
  /**
   * Runs `script` inside the WebView page and resolves with what it returns.
   *
   * The script is the body of an async function: it can `await`, and a
   * `return` value becomes the result. That result crosses the bridge as JSON,
   * so it must be JSON-serializable. A syntax error, a thrown error, or an
   * unserializable result rejects the promise with the page's message.
   *
   * This is the escape hatch for anything the ref does not cover. The page is
   * yours, so the script can do anything page code can — see "Bridging custom
   * actions" in the reference.
   * @param script The body of an async function, e.g. `return window.scrollY;`.
   * @throws js Error
   */
  evaluateJavaScript: <T = unknown>(
    script: string,
    options?: EvaluateJavaScriptOptions
  ) => Promise<T>;
};

/**
 * Options for {@link SelectableTextViewRef.evaluateJavaScript}.
 */
export type EvaluateJavaScriptOptions = {
  /**
   * How long to wait for the script to settle, in milliseconds.
   *
   * The clock starts when the call is made. A call made before the page has
   * loaded is queued until it has, and that wait counts against the timeout —
   * so a script run on mount that also awaits something (web fonts, say) needs
   * a timeout covering both.
   *
   * @default 2000
   */
  timeout?: number;
};

/**
 * A message a script in the page sent with
 * `window.SelectableText.postMessage(type, data)`.
 */
export type CustomMessage = {
  /** The name the page gave the message. */
  type: string;
  /** What the page sent along, after a JSON round trip. */
  data: unknown;
};

export type SelectableTextViewPropsBase = {
  /**
   * --> Final property
   * A list of Highlighter, each with a unique name and an options object describing how to render the highlight
   * (background-color, text-decoration-color, outline-color or background-image).
   * The name is used as the className of the tag that wraps the selection, so in the css property you can add
   * more styles that not support by the Highlighter.options. If names are repeated, the last one will be chosen.
   * @default [{ name: "yellow-highlighter", options: { type: "background-color", color: "yellow" } }]
   */
  highlighters?: Highlighter[];
  /**
   * --> Final property
   * The serialized highlights to paint on mount — the string a previous session
   * stored, from `getHighlights()` or `onHighlightsChange`.
   *
   * It is read once, when the content is built. Changing it afterwards does
   * nothing: use {@link SelectableTextViewRef.setHighlights} to replace the
   * highlights of a mounted view, and remount the component to start from a
   * different document.
   */
  initialHighlights?: Highlights;
  /**
   * --> Final property
   * A html string that will be rendered in the WebView.
   * You can add class names and reference them in the css property to style the content.
   * Changing this params no trigger a re-render, you have to remount the component or change the rerender function to trigger a re-render with the new content.
   */
  content?: HTMLString;
  /**
   * --> Final property
   * A CSS string that will be injected into the WebView to style the content. This can be used to customize the appearance of the content, for example by changing the font size or color.
   * This use a default implementation that provides some basic styles for the content, but you can provide your own implementation if you want to customize the appearance.
   */
  css?: CSSString;
  /**
   * --> Final property
   * Font resources injected into the WebView head: preconnect hints, external stylesheets
   * (e.g. Google Fonts), and optional @font-face rules for self-hosted fonts.
   * Use the exported googleFonts() helper or build SelectableTextViewFonts manually.
   */
  fonts?: SelectableTextViewFonts;
  /**
   * --> Final property
   * Rangy highlighter options. See {@link HighlighterOptions}.
   */
  highlighterOptions?: HighlighterOptions;
  /**
   * --> Final property
   * A object which represents the available options to customize the behavior of the component.
   */
  options?: SelectableTextViewOptions;
  /**
   * --> State property
   * A callback function that will be called when the user clicks on a link in the content.
   * The callback will receive the URL of the link that was clicked.
   * You can use this callback to perform any action you want when the user clicks on a link,
   * Note that WebView not support local navigation to another page, so you have to handle the link clicks yourself in this callback.
   * You can also use this callback to prevent the default behavior of the link clicks, for example by not doing anything when a link is clicked.
   *  @param url
   *
   */
  onLink?: (url: string) => void;
  /**
   * --> State property
   * A callback function that will be called when the selected text changes.
   * The callback will receive the currently selected text as a parameter.
   * You can use this callback to perform any action you want when the selected text changes.
   * @param selectedText
   */
  onTextSelectionChange?: (selectedText: string) => void;
  /**
   * --> State property
   * Called when the serialized highlights change.
   * @param highlights The serialized payload, to persist and feed back into the `highlights` prop.
   * @param items The highlights the payload contains, already resolved, so there is no
   * need to follow every change with a `getAllHighlightsData()` call.
   */
  onHighlightsChange?: (highlights: Highlights, items: HighlightData[]) => void;
  /**
   * --> State property
   * Called when an error occurs inside the WebView SDK (highlight restore, bridge, selection, etc.).
   * The payload includes {@link SelectableTextViewError.code}, {@link SelectableTextViewError.message},
   * and optional {@link SelectableTextViewError.details}.
   * @param error
   */
  onError?: (error: SelectableTextViewError) => void;
  /**
   * --> State property
   * Called when a highlight is pressed.
   * The payload includes the id, name and text of the highlight, plus `rect` and
   * `rects`: where it sits inside the WebView when it was tapped, ready to anchor
   * a popover to. Those are a snapshot — scrolling afterwards does not update them.
   * @param highlight
   * @returns The className to apply to the highlight a focus style, you can styles for this className in the css property or return void to not apply any style.
   * The focus style is applied in place (without scrolling); use `focusHighlight(id)` if you also want to scroll to it.
   * The callback may be async: return a `Promise` and the resolved className (if any) is applied.
   */
  onHighlightPressed?: (
    highlight: PressedHighlightData
  ) => string | void | Promise<string | void>;
  /**
   * --> State property
   * Called when the highlights visibility state changes.
   * @param visibilityState
   */
  onHighlightsVisibilityStateChange?: (visibilityState: boolean) => void;
  /**
   * Called when a script in the page sends a message with
   * `window.SelectableText.postMessage(type, data)`.
   *
   * Only those messages arrive here, never the module's own traffic — unlike
   * `webViewProps.onMessage`, which sees everything and has to tell the two
   * apart. See "Bridging custom actions" in the reference.
   * @param message The `type` and `data` the page sent.
   */
  onCustomMessage?: (message: CustomMessage) => void;

  /**
   * Called when the undo history moves, so the controls that drive it can
   * enable and disable themselves without keeping their own copy of it.
   *
   * Fires on every recorded change and on each `undo()` / `redo()`.
   */
  onHistoryChange?: (event: HistoryChangeEvent) => void;
};

export type Message = {
  type: string;
  value: any;
};

export const BridgingNames = {
  // in
  functions: {
    updateHighlights: "updateHighlights",
    highlightSelection: "highlightSelection",
    unhighlightSelection: "unhighlightSelection",
    clearHighlights: "clearHighlights",
    focusHighlight: "focusHighlight",
    unfocusHighlight: "unfocusHighlight",
    unhighlightById: "unhighlightById",
    redo: "redo",
    undo: "undo",
    clearHistory: "clearHistory",
  },
  // out
  events: {
    onTextSelectionChange: "onTextSelectionChange",
    onHighlightsChange: "onHighlightsChange",
    onError: "onError",
    onHighlightPressed: "onHighlightPressed",
    onHighlightsVisibilityStateChange: "onHighlightsVisibilityStateChange",
    onCustomMessage: "onCustomMessage",
    onHistoryChange: "onHistoryChange",
    // dev
    log: "log",
  },
  // in - out
  promises: {
    getSelectedText: "getSelectedText",
    getHighlights: "getHighlights",
    getAllHighlightsData: "getAllHighlightsData",
    getHighlightsVisibilityState: "getHighlightsVisibilityState",
    toggleHighlightsVisibility: "toggleHighlightsVisibility",
    evaluateJavaScript: "evaluateJavaScript",
    getHistory: "getHistory",
  },
};

/**
 * How many states the undo history keeps. Every entry is a whole serialized
 * payload, and a reader can produce a great many in one sitting, so the oldest
 * are dropped rather than held forever.
 */
export const HISTORY_LIMIT = 50;

export const VERSION = "1.2.2";
