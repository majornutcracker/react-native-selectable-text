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
        const error = data.value.error;
        if (success) {
          promises.current[id]?.resolve(text ?? "");
        } else {
          promises.current[id]?.reject(
            new Error(error ?? "Unknown error while getting selected text")
          );
        }
        delete promises.current[id];
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

  React.useEffect(() => {
    return () => {
      for (const key in promises.current) {
        promises.current[key]?.reject(new Error("Component unmounted"));
        delete promises.current[key];
      }
    };
  }, []);

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

  const clearHighlights = () => {
    _postMessage({
      type: BridgingNames.functions.clearHighlights,
      value: undefined,
    });
  };

  const getSelectedText = async () => {
    return new Promise<string>((resolve, reject) => {
      const id = generatePromiseId();
      promises.current[id] = {
        resolve,
        reject,
      };
      _postMessage({
        type: BridgingNames.promises.getSelectedText,
        value: id,
      });
      setTimeout(() => {
        if (promises.current[id]) {
          promises.current[id]?.reject(new Error("Timeout"));
          delete promises.current[id];
        }
      }, 2000); // 2 second timeout
    });
  };

  const getHighlights = async () => {
    return new Promise<Highlights>((resolve, reject) => {
      const id = generatePromiseId();
      promises.current[id] = {
        resolve,
        reject,
      };
      _postMessage({
        type: BridgingNames.promises.getHighlights,
        value: id,
      });
      setTimeout(() => {
        if (promises.current[id]) {
          promises.current[id]?.reject(new Error("Timeout"));
          delete promises.current[id];
        }
      }, 2000); // 2 second timeout
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
    clearHighlights,
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
