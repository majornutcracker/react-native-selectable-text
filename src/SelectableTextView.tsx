import * as React from "react";
import { WebView, WebViewProps } from "react-native-webview";

import {
  BridgingNames,
  Message,
  SelectableTextViewPropsBase,
  SelectableTextViewRef,
  Highlights,
} from "./types";
import { generatePromiseId, htmlContent } from "./utils";
import { Linking, Platform } from "react-native";
import { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

export type SelectableTextViewProps = SelectableTextViewPropsBase & {
  webViewProps?: WebViewProps;
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
  const promises = React.useRef<{
    [key: string]: {
      id: string;
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
    };
  }>({});

  const webviewRef = React.useRef<WebView>(null);

  const finalSource = React.useRef({
    html: htmlContent({
      cC: colorClasses,
      h: highlights,
      c: content,
      css: css,
      ho: highlighterOptions,
      p: Platform.OS,
    }),
  });

  const handleMessage = React.useCallback(
    (event: any) => {
      const data = JSON.parse(event.nativeEvent.data) as Message;
      if (data.type === BridgingNames.events.onHighlightsChange) {
        onHighlightsChange?.(data.value as string);
      } else if (data.type === BridgingNames.events.onTextSelectionChange) {
        onTextSelectionChange?.(data.value as string);
      } else if (data.type === BridgingNames.promises.getSelectedText) {
        const success = data.value.success;
        const id = data.value.promiseId;
        const text = data.value.text;
        if (success) {
          promises.current[id]?.resolve(text);
        } else {
          promises.current[id]?.reject(
            new Error("Failed to get selected text")
          );
        }
        delete promises.current[id];
      } else if (data.type === BridgingNames.promises.getHighlights) {
        const success = data.value.success;
        const id = data.value.promiseId;
        const highlights = data.value.highlights;
        if (success) {
          promises.current[id]?.resolve(highlights);
        } else {
          promises.current[id]?.reject(new Error("Failed to get highlights"));
        }
        delete promises.current[id];
      }
    },
    [onTextSelectionChange, onHighlightsChange]
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
    _postMessage({
      type: BridgingNames.functions.updateHighlights,
      value: highlights,
    });
  }, [highlights]);

  const highlightSelection = (colorClassName?: string) => {
    _postMessage({
      type: BridgingNames.functions.highlightSelection,
      value: colorClassName,
    });
  };

  const unhighlightSelection = () => {
    _postMessage({
      type: BridgingNames.functions.unhighlightSelection,
      value: undefined,
    });
  };

  const getSelectedText = async () => {
    return new Promise<string>((resolve, reject) => {
      const id = generatePromiseId();
      promises.current[id] = {
        id,
        resolve,
        reject,
      };
      _postMessage({
        type: BridgingNames.promises.getSelectedText,
        value: id,
      });
      setTimeout(() => {
        reject(new Error("Timeout"));
        delete promises.current[id];
      }, 1000); // 1 second timeout
    });
  };

  const getHighlights = async () => {
    return new Promise<Highlights>((resolve, reject) => {
      const id = generatePromiseId();
      promises.current[id] = {
        id,
        resolve,
        reject,
      };
      _postMessage({
        type: BridgingNames.promises.getHighlights,
        value: id,
      });
      setTimeout(() => {
        reject(new Error("Timeout"));
        delete promises.current[id];
      }, 1000); // 1 second timeout
    });
  };

  const _postMessage = (message: Message) => {
    webviewRef.current?.postMessage(JSON.stringify(message));
  };

  React.useImperativeHandle(ref, () => ({
    highlightSelection,
    unhighlightSelection,
    getSelectedText,
    getHighlights,
  }));

  return (
    <WebView
      {...webViewProps}
      ref={webviewRef}
      source={finalSource.current}
      domStorageEnabled={false}
      javaScriptEnabled
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
    />
  );
});

SelectableTextView.displayName = "SelectableTextView";

export default SelectableTextView;
