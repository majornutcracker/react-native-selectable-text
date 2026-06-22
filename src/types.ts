export type Highlights = string;

export type HTMLString = string;

export type CSSString = string;

export type ColorClassName = string;

export type ColorClass = {
  /**
   * A unique className that would be used as CSS classes to apply the selection
   */
  name: ColorClassName;
  color: string;
};

export type HighlighterOptions = {
  /**
   * A boolean to enable the overlap of highlights
   * @default false
   */
  overlapping?: boolean;
  /**
   * A boolean indicating whether to ignore insignificant whitespace text nodes
   * (e.g., line breaks or indentation between <p> tags in the HTML).
   * @default true
   */
  ignoreWhiteSpace?: boolean;
  /**
   * A list of tag or classes to avoid on selection (e.g., 'a', '.no-select' )
   * @default ['a','sub','sup']
   */
  ignoredElements?: string[];
};

export type SelectableTextViewRef = {
  /**
   * A function that applies highlighting to the current selection with a colorClassName previously defined in the colorClasses property;
   * if it is not defined, the highlighting will not be applied.
   * @param name
   */
  highlightSelection: (name?: ColorClassName) => void;
  /**
   * A function that removes the highlighting from the current selection
   */
  unhighlightSelection: () => void;
  /**
   * A function that removes all the highlights
   */
  clearHighlights: () => void;
  /**
   * A promise that returns the selected text
   * @throws
   * @returns The selected text
   */
  getSelectedText: () => Promise<string>;
  /**
   * A promise that returns the serialization of the current highlighting
   * @throws
   * @returns The serialization of the current highlighting
   */
  getHighlights: () => Promise<Highlights>;
};

export type SelectableTextViewPropsBase = {
  /**
   * --> Final property
   * A list of ColorClass containing a unique name, color Hex or strings, The name is used as the className of the tag that wraps the selection,
   * so in the css property you can add more styles than just the background color. If names are repeated, the last one will be chosen.
   * @default [{name: yellow-highlighter, color: yellow}]
   */
  colorClasses?: ColorClass[];
  /**
   * --> State property
   * A serialized string that represents the current highlights in the content. This can be used to restore the highlights when the component is re-rendered, for example when the user navigates away from the screen and then comes back.
   * You can obtain this string from getHighlights method or onHighlightsChange event.
   * You can also use as a state, the content will be re-rendered with the highlights applied whenever this string changes.
   */
  highlights?: Highlights;
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
   * A rangy highlighter and classApplier options object.
   * A object which represents the available highlighter options
   */
  highlighterOptions?: HighlighterOptions;
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
   * A callback function that will be called when the highlights changes.
   * The callback will receive the currently highlights as a parameter.
   * You can use this callback to perform any action you want when the highlights changes.
   * @param selectedText
   */
  onHighlightsChange?: (highlights: Highlights) => void;
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
  },
  // out
  events: {
    onTextSelectionChange: "onTextSelectionChange",
    onHighlightsChange: "onHighlightsChange",
  },
  // in - out
  promises: {
    getSelectedText: "getSelectedText",
    getHighlights: "getHighlights",
  },
};

/*

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
*/
