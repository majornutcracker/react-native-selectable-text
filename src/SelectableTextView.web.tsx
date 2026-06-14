import * as React from "react";
import { useEffect, useRef } from "react";

import {
  BridgingNames,
  SelectableTextViewPropsBase,
  SelectableTextViewRef,
} from "./types";
import { htmlContent } from "./utils";
import { Linking } from "react-native";

export type SelectableTextViewProps = SelectableTextViewPropsBase & {
  webViewProps?: React.IframeHTMLAttributes<HTMLIFrameElement>;
};

const SelectableTextView = React.forwardRef<
  SelectableTextViewRef,
  SelectableTextViewProps
>((props, ref) => {
  const {
    colorClasses,
    highlights,
    content,
    css,
    highlighterOptions,
    onLink,
    onTextSelectionChange,
    onHighlightsChange,
    webViewProps,
  } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const finalSource = useRef({
    html: htmlContent({
      cC: colorClasses,
      h: highlights,
      c: content,
      css: css,
      ho: highlighterOptions,
      p: "web",
    }),
  });

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === BridgingNames.events.onHighlightsChange) {
          onHighlightsChange?.(data.value as string);
        } else if (data.type === BridgingNames.events.onTextSelectionChange) {
          onTextSelectionChange?.(data.value as string);
        }
      } catch (err) {
        console.warn("Failed to parse message from iframe:", err);
      }
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, [onHighlightsChange, onTextSelectionChange]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.addEventListener("click", (e) => {
        const target = (e.target as HTMLElement).closest("a");
        if (target && (target as HTMLAnchorElement).href) {
          e.preventDefault();
          const href = (target as HTMLAnchorElement).href;
          if (href.startsWith("https://") || href.startsWith("http://")) {
            Linking.openURL(href);
          }
          onLink?.(href);
        }
      });
    };
    iframe.addEventListener("load", handleLoad);
    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [onLink]);

  useEffect(() => {
    const serial = { type: "updateHighlights", value: highlights };
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(serial), "*");
  }, [highlights]);

  const highlightSelection = (colorClassName?: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ type: "highlightSelection", value: colorClassName }),
      "*"
    );
  };

  const unhighlightSelection = () => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ type: "unhighlightSelection" }),
      "*"
    );
  };

  const getSelectedText = async () => {
    return "";
  };

  const getHighlights = async () => {
    return "";
  };

  React.useImperativeHandle(ref, () => ({
    highlightSelection,
    unhighlightSelection,
    getSelectedText,
    getHighlights,
  }));

  return (
    <iframe
      ref={iframeRef}
      {...webViewProps}
      sandbox="allow-scripts"
      srcDoc={finalSource.current.html}
    />
  );
});

SelectableTextView.displayName = "SelectableTextView";

export default SelectableTextView;
