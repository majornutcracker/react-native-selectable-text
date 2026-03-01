import * as React from "react";
import { useEffect, useRef } from "react";

import { SelectableTextViewPropsBase } from "./types";
import { htmlContent } from "./utils";
import { Linking } from "react-native";

export type SelectableTextViewProps = SelectableTextViewPropsBase &
  React.IframeHTMLAttributes<HTMLIFrameElement>;

export default function SelectableTextView(props: SelectableTextViewProps) {
  const {
    highlights,
    rerender,
    css,
    blocks,
    actions,
    onAction,
    onLink,
    srcDoc,
    ...webViewProps
  } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const finalSource = useRef(
    htmlContent(blocks, rerender, actions, css, "web", highlights)
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onAction?.(data);
      } catch (err) {
        console.warn("Failed to parse message from iframe:", err);
      }
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, [onAction]);

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

  return (
    <iframe
      ref={iframeRef}
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        border: "none",
        padding: 0,
        margin: 0,
      }}
      sandbox="allow-scripts"
      {...webViewProps}
      srcDoc={finalSource.current}
    />
  );
}
