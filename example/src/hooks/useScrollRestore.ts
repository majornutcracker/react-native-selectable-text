import type { SelectableTextViewRef } from "@majornutcracker/react-native-selectable-text";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { WebViewScrollEvent } from "react-native-webview/lib/WebViewTypes";

import { useHighlights } from "@/context/HighlightsProvider";

type ScrollHandler = (event: WebViewScrollEvent) => void;

/**
 * The restore runs on mount, so this covers the page load as well as the web
 * fonts the script waits for. If it runs out the reader is shown where it is,
 * rather than left behind the spinner.
 */
const RESTORE_TIMEOUT_MS = 6000;

function clampFraction(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/**
 * Remembers where a reader was left and puts it back on the next visit.
 *
 * The position is kept as a fraction of the scrollable height, not in pixels:
 * the same pixel offset points at different text after a rotation or on a wider
 * screen. `onScroll` reports offset, content size and viewport in one unit per
 * platform — points on iOS, dp on Android — so the fraction is unit-free.
 *
 * Returns `onScroll` for the WebView and `ready` for the loading overlay.
 */
export function useScrollRestore(
  documentId: string,
  viewRef: RefObject<SelectableTextViewRef | null>
) {
  const { scrollFor, saveScroll } = useHighlights();
  const [ready, setReady] = useState(false);

  // Positions are only recorded after the restore. Before it, the page sits at
  // the top, and iOS can report that during layout — leaving right then would
  // otherwise overwrite the saved position with 0.
  const restored = useRef(false);

  useEffect(() => {
    let active = true;
    const reveal = () => {
      if (active) {
        restored.current = true;
        setReady(true);
      }
    };

    const view = viewRef.current;
    if (!view) {
      reveal();
      return;
    }

    const fraction = clampFraction(scrollFor(documentId));
    // Queued by the view until the page has loaded. It waits for web fonts
    // first: the readers use Google Fonts with `display=swap`, so scrolling
    // before they arrive lands on a layout about to reflow, and drifts.
    view
      .evaluateJavaScript(
        `
        if (document.fonts) await document.fonts.ready;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max > 0) window.scrollTo(0, ${fraction} * max);
        `,
        { timeout: RESTORE_TIMEOUT_MS }
      )
      // A failed or slow restore still has to reveal the page.
      .catch(() => {})
      .finally(reveal);

    return () => {
      active = false;
    };
  }, [documentId, scrollFor, viewRef]);

  const onScroll = useCallback<ScrollHandler>(
    (event) => {
      if (!restored.current) {
        return;
      }
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      const max = contentSize.height - layoutMeasurement.height;
      saveScroll(
        documentId,
        max > 0 ? clampFraction(contentOffset.y / max) : 0
      );
    },
    [documentId, saveScroll]
  );

  return useMemo(() => ({ ready, onScroll }), [ready, onScroll]);
}
