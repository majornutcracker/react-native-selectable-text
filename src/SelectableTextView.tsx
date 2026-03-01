import * as React from "react";
import { WebView } from "react-native-webview";

import { SelectableTextViewProps } from "./types";
import { useRef } from "react";
import { useCallback } from "react";
import { htmlContent } from "./utils";
import { Linking, Platform } from "react-native";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

export default function SelectableTextView(props: SelectableTextViewProps) {
  const {
    highlights,
    rerender,
    css,
    blocks,
    actions,
    onAction,
    onLink,
    ...webViewProps
  } = props;
  const webviewRef = useRef<WebView>(null);

  const finalSource = useRef({
    html: htmlContent(blocks, rerender, actions, css, Platform.OS, highlights),
  });

  const handleMessage = useCallback(
    (event: any) => {
      const data = JSON.parse(event.nativeEvent.data);
      onAction?.(data);
    },
    [onAction]
  );

  const handleShouldStartLoadWithRequest = useCallback(
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
    const serial = { type: "updateHighlights", value: highlights };
    webviewRef.current?.postMessage(JSON.stringify(serial));
  }, [highlights]);

  return (
    <WebView
      ref={webviewRef}
      style={{ flex: 1 }}
      {...webViewProps}
      source={finalSource.current}
      javaScriptEnabled
      domStorageEnabled={false}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
    />
  );
}
