import * as React from "react";
import { WebView, type WebViewProps } from "react-native-webview";
import {
  BridgingNames,
  type Message,
  type SelectableTextViewPropsBase,
  type SelectableTextViewRef,
  type Highlights,
  type SelectableTextViewError,
  type HighlightData,
  type PressedHighlightData,
  type HighlighterName,
  type SelectionActionOptions,
  type FocusHighlightOptions,
  type UnhighlightOptions,
  type EvaluateJavaScriptOptions,
  type HistoryChange,
  type HistoryState,
} from "./types";
import { generatePromiseId, htmlContent } from "./utils";
import { Linking, Platform } from "react-native";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

/** How long a request to the WebView may go unanswered before it rejects. */
const PROMISE_TIMEOUT_MS = 2000;

type PendingPromise = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer?: ReturnType<typeof setTimeout>;
};

export type SelectableTextViewProps = SelectableTextViewPropsBase & {
  webViewProps?: Omit<
    WebViewProps,
    "javaScriptEnabled" | "source" | "onShouldStartLoadWithRequest"
  >;
};

/**
 * The page reports the history the same way in its event and in its answer to
 * `getHistory`, so both are read here rather than in two places that could
 * drift apart.
 */
function readHistoryState(value: any): HistoryState {
  return {
    history: (value?.history ?? []) as Highlights[],
    historyIndex: Number(value?.historyIndex ?? 0),
    length: Number(value?.length ?? 0),
    canUndo: Boolean(value?.canUndo),
    canRedo: Boolean(value?.canRedo),
  };
}

const SelectableTextView = React.forwardRef<
  SelectableTextViewRef,
  SelectableTextViewProps
>((props, ref) => {
  const {
    highlighters,
    initialHighlights,
    content,
    css,
    fonts,
    highlighterOptions,
    options,
    onLink,
    onTextSelectionChange,
    onHighlightsChange,
    onError,
    onHighlightPressed,
    onHighlightsVisibilityStateChange,
    onCustomMessage,
    onHistoryChange,
    webViewProps,
  } = props;
  const promises = React.useRef<Record<string, PendingPromise>>({});

  /**
   * Forgets a pending request and cancels its timeout.
   *
   * The timer used to outlive the answer: harmless, since it checked the entry
   * before firing, but it kept the closure alive for two seconds past every
   * call and past unmount.
   */
  const settlePromise = (id: string) => {
    const pending = promises.current[id];
    if (pending?.timer) {
      clearTimeout(pending.timer);
    }
    delete promises.current[id];
  };

  const webviewRef = React.useRef<WebView<object>>(null);

  // Which selection the last getSelectedText() read, so an action decided on
  // that text can refuse to land on a different one.
  const lastSelectionVersion = React.useRef<number | undefined>(undefined);

  // Anything posted before the WebView document is ready is dropped on the
  // floor. Queue instead: a `highlights` change during the initial load would
  // otherwise be lost for good, and early imperative calls would reject with a
  // misleading "Timeout".
  const isWebViewReady = React.useRef(false);
  const pendingMessages = React.useRef<Message[]>([]);

  const finalSource = React.useRef({
    html: htmlContent({
      hl: highlighters,
      h: initialHighlights,
      c: content,
      css: css,
      f: fonts,
      ho: highlighterOptions,
      p: Platform.OS,
      o: options,
    }),
  });

  const handleMessage = React.useCallback(
    async (event: any) => {
      webViewProps?.onMessage?.(event);

      // Any script in the rendered content can call postMessage, so the payload
      // is not guaranteed to be ours or to be JSON. Without this guard the throw
      // escapes an async handler as an unhandled promise rejection.
      let data: Message;
      try {
        data = JSON.parse(event.nativeEvent.data) as Message;
      } catch {
        return;
      }
      if (data?.type == null) {
        return;
      }

      try {
        if (data.type === BridgingNames.events.onHighlightsChange) {
          const serialized = (data.value?.highlights ?? "") as Highlights;
          onHighlightsChange?.(
            serialized,
            (data.value?.items ?? []) as HighlightData[]
          );
        } else if (data.type === BridgingNames.events.onTextSelectionChange) {
          onTextSelectionChange?.(data.value as string);
        } else if (data.type === BridgingNames.promises.getSelectedText) {
          const success = data.value.success;
          const id = data.value.promiseId;
          const text = data.value.text;
          const error = data.value.error;
          if (success) {
            // Kept aside rather than resolved with the text: getSelectedText is
            // public and resolves to a plain string.
            lastSelectionVersion.current = data.value.selectionVersion;
            promises.current[id]?.resolve(text ?? "");
          } else {
            promises.current[id]?.reject(
              new Error(error ?? "Unknown error while getting selected text")
            );
          }
          settlePromise(id);
        } else if (data.type === BridgingNames.promises.getHighlights) {
          const success = data.value.success;
          const id = data.value.promiseId;
          const highlights = data.value.highlights;
          const error = data.value.error;
          if (success) {
            promises.current[id]?.resolve(highlights ?? "");
          } else {
            promises.current[id]?.reject(
              new Error(error ?? "Unknown error while getting highlights")
            );
          }
          settlePromise(id);
        } else if (data.type === BridgingNames.promises.getAllHighlightsData) {
          const success = data.value.success;
          const id = data.value.promiseId;
          const highlightsData = data.value.highlightsData;
          const error = data.value.error;
          if (success) {
            promises.current[id]?.resolve(highlightsData ?? []);
          } else {
            promises.current[id]?.reject(
              new Error(
                error ?? "Unknown error while getting all highlights data"
              )
            );
          }
          settlePromise(id);
        } else if (data.type === BridgingNames.events.log) {
          console.log("Log: ", data.value);
        } else if (data.type === BridgingNames.events.onError) {
          onError?.(data.value as SelectableTextViewError);
        } else if (data.type === BridgingNames.events.onHighlightPressed) {
          const pressed = data.value as PressedHighlightData;
          const className = await onHighlightPressed?.({
            ...pressed,
            // A highlighter whose spans were all unwrapped reports no boxes;
            // hand the callback a usable shape rather than undefined.
            rect: pressed.rect ?? { x: 0, y: 0, width: 0, height: 0 },
            rects: pressed.rects ?? [],
          });
          if (className) {
            _postMessage({
              type: BridgingNames.functions.focusHighlight,
              value: {
                id: data.value.id,
                className,
                options: { scroll: false },
              },
            });
          }
        } else if (
          data.type === BridgingNames.promises.getHighlightsVisibilityState
        ) {
          const success = data.value.success;
          const id = data.value.promiseId;
          const visible = data.value.visible;
          const error = data.value.error;
          if (success) {
            promises.current[id]?.resolve(visible ?? false);
          } else {
            promises.current[id]?.reject(
              new Error(
                error ??
                  "Unknown error while getting highlights visibility state"
              )
            );
          }
          settlePromise(id);
        } else if (
          data.type === BridgingNames.promises.toggleHighlightsVisibility
        ) {
          const success = data.value.success;
          const id = data.value.promiseId;
          const visible = data.value.visible;
          const error = data.value.error;
          if (success) {
            promises.current[id]?.resolve(visible ?? false);
          } else {
            promises.current[id]?.reject(
              new Error(
                error ?? "Unknown error while toggling highlights visibility"
              )
            );
          }
          settlePromise(id);
        } else if (
          data.type === BridgingNames.events.onHighlightsVisibilityStateChange
        ) {
          onHighlightsVisibilityStateChange?.(data.value as boolean);
        } else if (data.type === BridgingNames.promises.evaluateJavaScript) {
          const id = data.value.promiseId;
          if (data.value.success) {
            promises.current[id]?.resolve(data.value.result);
          } else {
            promises.current[id]?.reject(
              new Error(
                data.value.error ?? "Unknown error while evaluating JavaScript"
              )
            );
          }
          settlePromise(id);
        } else if (data.type === BridgingNames.events.onCustomMessage) {
          // Any script in the page can post this type, so only a well-formed
          // message is passed on.
          const message = data.value;
          if (typeof message?.type === "string") {
            onCustomMessage?.({ type: message.type, data: message.data });
          }
        } else if (data.type === BridgingNames.events.onHistoryChange) {
          onHistoryChange?.({
            ...readHistoryState(data.value),
            change: data.value.change as HistoryChange,
          });
        } else if (data.type === BridgingNames.promises.getHistory) {
          const id = data.value.promiseId;
          promises.current[id]?.resolve(readHistoryState(data.value));
          settlePromise(id);
        }
      } catch (error) {
        // A consumer callback threw or rejected. This handler is async, so
        // letting it escape would surface as an unhandled promise rejection
        // detached from the callback that actually caused it.
        console.error(
          "[@majornutcracker/react-native-selectable-text] Error handling bridge message:",
          error
        );
      }
    },
    [
      onTextSelectionChange,
      onHighlightsChange,
      onError,
      onHighlightsVisibilityStateChange,
      onHighlightPressed,
      onCustomMessage,
      webViewProps?.onMessage,
    ]
  );

  const handleShouldStartLoadWithRequest = React.useCallback(
    (request: ShouldStartLoadRequest) => {
      if (request.url === "about:blank") return true;

      if (onLink) {
        onLink?.(request.url);
      } else {
        if (
          request.url.startsWith("https://") ||
          request.url.startsWith("http://")
        ) {
          Linking.openURL(request.url);
          return false;
        }
      }
      return false;
    },
    [onLink]
  );

  React.useEffect(() => {
    return () => {
      for (const key in promises.current) {
        promises.current[key]?.reject(new Error("Component unmounted"));
        settlePromise(key);
      }
    };
  }, []);

  const highlightSelection = (
    highlighterName?: HighlighterName,
    options?: SelectionActionOptions,
    expectSelectionVersion?: number
  ) => {
    _postMessage({
      type: BridgingNames.functions.highlightSelection,
      value: {
        name: highlighterName,
        keepSelection: options?.keepSelection === true,
        expectSelectionVersion,
      },
    });
  };

  const highlightSelectionWithValidation = async (
    validation: (text: string) => boolean | Promise<boolean>,
    highlighterName?: HighlighterName,
    options?: SelectionActionOptions
  ) => {
    try {
      const text = await getSelectedText();
      // Pinned before awaiting: validation may be slow, and the reader can keep
      // selecting while it runs. The WebView refuses a stale one.
      const selectionVersion = lastSelectionVersion.current;
      const result = await validation(text);
      if (result) {
        highlightSelection(highlighterName, options, selectionVersion);
      }
    } catch (error) {
      // This is a fire-and-forget action, and every call site would otherwise
      // need its own catch to keep a timeout, an unmount, or a throwing
      // validation from surfacing as an unhandled rejection.
      onError?.({
        name: "SelectableTextViewError",
        code: "failed_to_highlight_selection",
        message: "Failed to highlight the selection",
        details: error instanceof Error ? error.message : String(error),
      } as SelectableTextViewError);
    }
  };

  const unhighlightSelection = (
    options?: SelectionActionOptions & UnhighlightOptions
  ) => {
    _postMessage({
      type: BridgingNames.functions.unhighlightSelection,
      value: {
        keepSelection: options?.keepSelection === true,
        options: { className: options?.className, delay: options?.delay },
      },
    });
  };

  const clearHighlights = () => {
    _postMessage({
      type: BridgingNames.functions.clearHighlights,
      value: undefined,
    });
  };

  const focusHighlight = (
    id: string,
    className?: string,
    options?: FocusHighlightOptions
  ) => {
    _postMessage({
      type: BridgingNames.functions.focusHighlight,
      value: {
        id,
        className,
        options,
      },
    });
  };

  const unfocusHighlight = () => {
    _postMessage({
      type: BridgingNames.functions.unfocusHighlight,
      value: undefined,
    });
  };

  const unhighlightById = (id: string, options?: UnhighlightOptions) => {
    _postMessage({
      type: BridgingNames.functions.unhighlightById,
      value: { id, options },
    });
  };

  /**
   * Sends a request the page answers under the same id. Most requests carry
   * nothing but that id; `value` builds a richer payload around it when one is
   * needed.
   */
  const _request = <T,>(
    type: string,
    options: { value?: (id: string) => unknown; timeout?: number } = {}
  ) =>
    new Promise<T>((resolve, reject) => {
      const id = generatePromiseId();
      const entry: PendingPromise = { resolve, reject };
      promises.current[id] = entry;
      _postMessage({ type, value: options.value ? options.value(id) : id });
      entry.timer = setTimeout(() => {
        if (promises.current[id] === entry) {
          entry.reject(new Error("Timeout"));
          settlePromise(id);
        }
      }, options.timeout ?? PROMISE_TIMEOUT_MS);
    });

  const getSelectedText = () =>
    _request<string>(BridgingNames.promises.getSelectedText);

  const getHighlights = () =>
    _request<Highlights>(BridgingNames.promises.getHighlights);

  const getAllHighlightsData = () =>
    _request<HighlightData[]>(BridgingNames.promises.getAllHighlightsData);

  const getHighlightsVisibilityState = () =>
    _request<boolean>(BridgingNames.promises.getHighlightsVisibilityState);

  const toggleHighlightsVisibility = () =>
    _request<boolean>(BridgingNames.promises.toggleHighlightsVisibility);

  const setHighlights = (highlights: Highlights) => {
    _postMessage({
      type: BridgingNames.functions.updateHighlights,
      value: highlights,
    });
  };

  const undo = () => {
    _postMessage({
      type: BridgingNames.functions.undo,
      value: null,
    });
  };

  const redo = () => {
    _postMessage({
      type: BridgingNames.functions.redo,
      value: null,
    });
  };

  const clearHistory = () => {
    _postMessage({
      type: BridgingNames.functions.clearHistory,
      value: null,
    });
  };

  const getHistory = () =>
    _request<HistoryState>(BridgingNames.promises.getHistory);

  const evaluateJavaScript = <T,>(
    script: string,
    options?: EvaluateJavaScriptOptions
  ) =>
    _request<T>(BridgingNames.promises.evaluateJavaScript, {
      value: (promiseId) => ({ promiseId, script }),
      // A timeout that is not a positive finite number would either fire at
      // once or never; neither is what the caller meant, so use the default.
      timeout:
        typeof options?.timeout === "number" &&
        Number.isFinite(options.timeout) &&
        options.timeout > 0
          ? options.timeout
          : PROMISE_TIMEOUT_MS,
    });

  const _postMessage = (message: Message) => {
    if (!isWebViewReady.current) {
      pendingMessages.current.push(message);
      return;
    }
    webviewRef.current?.postMessage(JSON.stringify(message));
  };

  const handleLoadEnd = React.useCallback(
    (event: any) => {
      isWebViewReady.current = true;
      const queued = pendingMessages.current;
      pendingMessages.current = [];
      queued.forEach((message) => {
        webviewRef.current?.postMessage(JSON.stringify(message));
      });
      webViewProps?.onLoadEnd?.(event);
    },
    [webViewProps?.onLoadEnd]
  );

  React.useImperativeHandle(ref, () => ({
    highlightSelection,
    highlightSelectionWithValidation,
    unhighlightSelection,
    getSelectedText,
    getHighlights,
    clearHighlights,
    focusHighlight,
    unfocusHighlight,
    unhighlightById,
    getAllHighlightsData,
    getHighlightsVisibilityState,
    toggleHighlightsVisibility,
    evaluateJavaScript,
    setHighlights,
    undo,
    redo,
    clearHistory,
    getHistory,
  }));

  return (
    <WebView
      {...webViewProps}
      ref={webviewRef}
      source={finalSource.current}
      javaScriptEnabled
      onMessage={handleMessage}
      onLoadEnd={handleLoadEnd}
      onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
    />
  );
});

SelectableTextView.displayName = "SelectableTextView";

export default SelectableTextView;
