import type { WebViewProps } from "react-native-webview";

export type Highlights = string;

export type SelectableTextViewProps = {
  /**
   * A serialized string that represents the current highlights in the content. This can be used to restore the highlights when the component is re-rendered, for example when the user navigates away from the screen and then comes back.
   * You can obtain this string from onAction callback.
   * You can also use as a state, the content will be re-rendered with the highlights applied whenever this string changes.
   */
  highlights?: Highlights;
  /**
   * A function that takes the content blocks and returns an HTML string to be rendered in the WebView. This can be used to customize the rendering of the content, for example by adding custom styles or handling certain block types differently.
   * This use a default implementation that renders the content blocks as simple HTML, but you can provide your own implementation if you want to customize the rendering.
   * @param content
   * @returns html
   */
  rerender?: (content: RootBlocks) => string;
  /**
   * A CSS string that will be injected into the WebView to style the content. This can be used to customize the appearance of the content, for example by changing the font size or color.
   * This use a default implementation that provides some basic styles for the content, but you can provide your own implementation if you want to customize the appearance.
   */
  css?: string;
  /**
   * A arrays blocks content that will be rendered in the WebView. This is an array of blocks that represent the content to be rendered. The blocks can be of different types, such as text, list, heading, etc. Each block type has its own properties that define how it should be rendered.
   */
  blocks?: RootBlocks;
  /**
   * An array of actions that will be displayed in the context menu when the user selects some text. Each action has a label and a value, and when the user selects an action, the onAction callback will be called with the selected action, the selected text, and the current highlights.
   * Default actions are "highlight" and "unhighlight", but you can provide your own actions if you want to customize the context menu. You can also provide an empty array if you don't want to show any actions in the context menu.
   * Action.value === highlight or unhighlight have a special meaning, they will trigger the default highlight and unhighlight behavior when selected.
   */
  actions?: Action[];
  /**
   * A callback function that will be called when the user selects an action from the context menu. The callback will receive an event object that contains the selected action, the selected text, and the current highlights. You can use this callback to perform any action you want when the user selects an action, for example by showing a modal or navigating to another screen.
   */
  onAction?: (event: {
    action: Action;
    selection: string;
    highlights: Highlights;
  }) => void;
  /**
   * A callback function that will be called when the user clicks on a link in the content. The callback will receive the URL of the link that was clicked. You can use this callback to perform any action you want when the user clicks on a link, for example by opening the link in a browser or navigating to another screen.
   * Note that WebView not support navigation to another page, so you have to handle the link clicks yourself in this callback. You can also use this callback to prevent the default behavior of the link clicks, for example by not doing anything when a link is clicked.
   */
  onLink?: (url: string) => void;
} & WebViewProps;

export type RootBlocks = (ListBlock | HeadingBlock | ParagraphBlock)[];

export interface TextBlock {
  type: "text";
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface ListBlock {
  type: "list";
  format: "ordered" | "unordered";
  children: (ListBlock | ListItemBlock)[];
}

export interface ListItemBlock {
  type: "list-item";
  children: (TextBlock | LinkBlock)[];
}

export interface LinkBlock {
  type: "link";
  url: string;
  children: TextBlock[];
}

export interface HeadingBlock {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: (TextBlock | LinkBlock)[];
}

export interface ParagraphBlock {
  type: "paragraph";
  children: (TextBlock | LinkBlock)[];
}

export interface Action {
  label: string;
  value: string;
}
