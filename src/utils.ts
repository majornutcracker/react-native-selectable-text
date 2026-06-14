import {
  classApplier,
  core,
  highlighter,
  saveStore,
  serializer,
  textRange,
} from "./rangy@1.3.2";
import {
  ColorClass,
  CSSString,
  HTMLString,
  HighlighterOptions,
  Highlights,
} from "./types";

export function generatePromiseId(): string {
  const id =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return id;
}

function uniqueByName(list: ColorClass[]): ColorClass[] {
  const map = new Map<string, ColorClass>();

  for (const item of list) {
    map.set(item.name, item);
  }

  return Array.from(map.values());
}

function colorClassesToCSS(list: ColorClass[]): string {
  return list
    .map((c) => `.${c.name} { background-color: ${c.color}; }`)
    .join("\n");
}

export const htmlContent = ({
  cC,
  h,
  c,
  css,
  ho,
  p,
}: {
  cC: ColorClass[] | undefined;
  h: Highlights | undefined;
  c: HTMLString | undefined;
  css: CSSString | undefined;
  ho: HighlighterOptions | undefined;
  p: string;
}) => {
  const platform = p;
  const highlights = h;
  const highlighterOptionsOverlapping = ho?.overlapping ?? false;
  const highlighterOptions = JSON.stringify({
    ignoreWhiteSpace: ho?.ignoreWhiteSpace ?? true,
    ignoredElements: ho?.ignoredElements ?? ["a", "sup", "sub"],
  });
  const uniqueCC: ColorClass[] = cC
    ? uniqueByName([
        {
          name: "yellow-highlighter",
          color: "yellow",
        },
        ...cC,
      ])
    : [
        {
          name: "yellow-highlighter",
          color: "yellow",
        },
      ];
  const applierNames = JSON.stringify(uniqueCC.map((c) => c.name));
  const content = c ?? "";
  const style = css ?? "";
  const colorClassesStyle = colorClassesToCSS(uniqueCC);

  return `
<!doctype html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <style>
      ${style}
      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
      }
      body {
        position: relative;
      }
      .tools {
        display: flex;
        flex-direction: row;
        position: absolute;
        opacity: 0;
        margin: 0;
        top: 0;
        left: 0;
        padding: 4px 6px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 20px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        transition: opacity 0.4s ease;
      }
      .tools button {
        background: none;
        border: none;
        margin: 0;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 14px;
        border-right: 1px solid #ddd;
        outline: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .tools button:last-child {
        border-right: none;
      }
      .tools button:hover {
        background: transparent;
      }
      .tools button:focus,
      .tools button:active {
        outline: none;
        box-shadow: none;
        background: none;
      }
      .no-select {
        -webkit-user-select: none;
        user-select: none;
      }
      ${colorClassesStyle}
    </style>
  </head>
  <body>
    ${content}
    <script>
      ${core}
    </script>
    <script>
      ${highlighter}
    </script>
    <script>
      ${classApplier}
    </script>
    <script>
      ${saveStore}
    </script>
    <script>
      ${serializer}
    </script>
    <script>
      ${textRange}
    </script>

    <script>
      const Platform = {
        ios: "ios",
        android: "android",
        web: "web",
      };

      document.documentElement.style.webkitUserSelect = "text";
      document.documentElement.style.webkitTouchCallout = "none";

      rangy.init();

      if (!window.__MNST__) {
        window.__MNST__ = {
          // constants
          platform: {
            platform: "${platform}",
            isIos: "${platform}" === Platform.ios,
            isAndroid: "${platform}" === Platform.android,
            isWeb: "${platform}" === Platform.web,
            isNative:
              "${platform}" === Platform.ios || "${platform}" === Platform.android,
          },
          // selection
          selector: {
            cache: {
              text: "",
              range: null,
            },
            getSelected: function () {
              let t;
              if (window.getSelection) {
                t = window.getSelection();
              } else if (document.getSelection) {
                t = document.getSelection();
              } else if (document.selection) {
                t = document.selection.createRange().text;
              }
              return t;
            },
          },
          // rangy
          highlighter: rangy.createHighlighter(),
          // extra
          overlapping: ${highlighterOptionsOverlapping}
        };
      }

      // Bootstrap
      if (!window.__MNST__init) {
        window.__MNST__init = true;

        try {
          const applierNames = ${applierNames};
          const highlighterOptions = ${highlighterOptions};
          applierNames.forEach((name) => {
            __MNST__.highlighter.addClassApplier(
              rangy.createClassApplier(name, {
                ignoreWhiteSpace: highlighterOptions.ignoreWhiteSpace ?? true,
                elementTagName: "span",
                ignoreSelector: highlighterOptions.ignoredElements
                  ? highlighterOptions.ignoredElements.map((s) => s.trim()).join(", ")
                  : "",
              })
            );
          });
        } catch (e) {
          console.error("Failed to update class appliers: ", e);
        }

        updateHighlights(${JSON.stringify(highlights ?? "")});

        if (__MNST__.platform.isAndroid) {
          document.addEventListener("message", function (event) {
            try {
              const data = JSON.parse(event.data);
              onMessage(data.type, data.value);
            } catch (e) {
              console.error("Error parsing message: ", e);
            }
          });
        } else {
          window.addEventListener("message", function (event) {
            try {
              const data = JSON.parse(event.data);
              onMessage(data.type, data.value);
            } catch (e) {
              console.error("Error parsing message: ", e);
            }
          });
        }
        document.addEventListener("selectionchange", function (e) {
          e.preventDefault();
          const selection = __MNST__.selector.getSelected();
          if (!selection || selection.toString().trim() === "") {
            __MNST__.selector.cache.text = "";
            __MNST__.selector.cache.range = null;
            sendOnTextSelectionChange("");
          } else {
            __MNST__.selector.cache.text = selection.toString();
            if (selection.rangeCount > 0) {
              __MNST__.selector.cache.range = selection.getRangeAt(0).cloneRange();
            }
            sendOnTextSelectionChange(__MNST__.selector.cache.text);
          }
        });
      }

      // <------------------------------ Bridging ----------------------------------->
      const BridgingNames = {
        // in
        functions: {
          updateHighlights: "updateHighlights",
          highlightSelection: "highlightSelection",
          unhighlightSelection: "unhighlightSelection",
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

      // @native-receiver
      function onMessage(type, value) {
        if (type === BridgingNames.functions.updateHighlights) {
          updateHighlights(value); // highlights
        } else if (type === BridgingNames.functions.highlightSelection) {
          highlightSelection(value ?? "yellow-highlighter"); // classApplierName
        } else if (type === BridgingNames.functions.unhighlightSelection) {
          unhighlightSelection();
        } else if (type === BridgingNames.promises.getSelectedText) {
          getSelectedText(value); // promiseId
        } else if (type === BridgingNames.promises.getHighlights) {
          getHighlights(value); // promiseId
        }
      }

      // @native-sender
      function postMessage(type, value) {
        const message = JSON.stringify({ type, value });
        if (__MNST__.platform.isNative && window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(message);
        } else if (__MNST__.platform.isWeb && window.parent) {
          window.parent.postMessage(message, "*");
        }
      }

      // @native-event
      function sendOnTextSelectionChange(text) {
        postMessage(BridgingNames.events.onTextSelectionChange, text);
      }

      // @native-event
      function sendOnHighlightChange(highlights) {
        postMessage(BridgingNames.events.onHighlightsChange, highlights);
      }

      // @native-promise-resolve
      function sendGetSelectedText(promiseId, success, text, error) {
        postMessage(BridgingNames.promises.getSelectedText, {
          promiseId,
          success,
          text,
          error,
        });
      }

      // @native-promise-resolve
      function sendGetHighlights(promiseId, success, highlights, error) {
        postMessage(BridgingNames.promises.getHighlights, {
          promiseId,
          success,
          highlights,
          error,
        });
      }

      // <------------------------ Internal functions ------------------------------->

      // @sdk-internal-with-event
      function updateHighlights(highlights) {
        try {
          __MNST__.highlighter.removeAllHighlights();
          __MNST__.highlighter.deserialize(highlights);
          sendOnHighlightChange(__MNST__.highlighter.serialize());
        } catch (e) {
          console.error("Failed to restore highlights: ", e);
        }
      }

      // @sdk-internal-with-event
      function highlightSelection(classApplierName) {
        try {
          const sel = document.getSelection();
          sel.removeAllRanges();
          sel.addRange(__MNST__.selector.cache.range);
          const rangySel = rangy.getSelection();
          if (!rangySel.isCollapsed) {
            __MNST__.highlighter.highlightSelection(classApplierName, {
              exclusive:
                typeof __MNST__.overlapping === "boolean"
                  ? !__MNST__.overlapping
                  : true,
            });
            sendOnHighlightChange(__MNST__.highlighter.serialize());
          }
        } catch (e) {
          console.error("Failed to highlight selection", e);
        }
      }

      // @sdk-internal-with-event
      function unhighlightSelection() {
        try {
          const sel = document.getSelection();
          sel.removeAllRanges();
          sel.addRange(__MNST__.selector.cache.range);
          const rangySel = rangy.getSelection();
          if (!rangySel.isCollapsed) {
            __MNST__.highlighter.unhighlightSelection();
            sendOnHighlightChange(__MNST__.highlighter.serialize());
          }
        } catch (e) {
          console.error("Failed to unhighlight selection: ", e);
        }
      }

      // @sdk-internal-with-resolve
      function getSelectedText(id) {
        try {
          if (!__MNST__.selector.cache.text) {
            sendGetSelectedText(id, true, "", undefined);
            return;
          } else {
            sendGetSelectedText(id, true, __MNST__.selector.cache.text, undefined);
          }
        } catch (e) {
          console.error("Failed to get selected text: ", e);
          sendGetSelectedText(id, false, undefined, e.message);
        }
      }

      // @sdk-internal-with-resolve
      function getHighlights(id) {
        try {
          sendGetHighlights(id, true, __MNST__.highlighter.serialize(), undefined);
        } catch (e) {
          console.error("Failed to get highlights: ", e);
          sendGetHighlights(id, false, undefined, e.message);
        }
      }

      true;
    </script>
  </body>
</html>
`;
};

/*
function parseActions(actions: Action[] | undefined): string {
  let html = "";
  if (!actions) {
    html = html.concat(
      `<button onclick="sendAction({ value : 'highlight', label : 'Highlight' }, event)">Highlight</button>`
    );
    html = html.concat(
      `<button onclick="sendAction({ value : 'unhighlight', label : 'Unhighlight' }, event)">Unhighlight</button>`
    );
  } else {
    actions.forEach((a) => {
  html = html.concat(
    `<button onclick="sendAction({ value : '${a.value}', label : '${a.label}' }, event)">${a.label}</button>`
  );
});
}
return html;
}

export function blocksRenderer(content: RootBlocks | undefined): string {
  return `
    <div class="content">
      ${content?.map((block, index) => blockRenderer(block, index)).join("")}
    </div>
  `;
}

const blocks = {
  heading: ({ level, children }: HeadingBlock, index: number) =>
    `
      <h${level} data-key="${index}">
        ${children.map((c, i) => inlineRenderer(c, i)).join("")}
      </h${level}>
    `,

  paragraph: ({ children }: ParagraphBlock, index: number) =>
    `
      <p data-key="${index}">
        ${children.map((c, i) => inlineRenderer(c, i)).join("")}
      </p>
    `,

  list: ({ children, format }: ListBlock, index: number) => {
    const tag = format === "ordered" ? "ol" : "ul";
    return `
      <${tag} data-key="${index}">
        ${children.map((c, i) => blockRenderer(c, i)).join("")}
      </${tag}>
    `;
  },

  "list-item": ({ children }: ListItemBlock, index: number) => {
    return `
      <li data-key="${index}">
        ${children.map((c, i) => inlineRenderer(c, i)).join("")}
      </li>
    `;
  },
};

function blockRenderer(
  block: RootBlocks[number] | ListItemBlock | undefined,
  index: number
): string {
  if (!block) return "";
  return blocks[block.type](block as any, index) ?? "";
}

function inlineRenderer(block: TextBlock | LinkBlock, index: number): string {
  if (block.type === "text") {
    let html = escapeHtml(block.text);

    if (block.code) html = `<code>${html}</code>`;
    if (block.strikethrough) html = `<s>${html}</s>`;
    if (block.underline) html = `<u>${html}</u>`;
    if (block.italic) html = `<em>${html}</em>`;
    if (block.bold) html = `<strong>${html}</strong>`;

    return html;
  }

  if (block.type === "link") {
    const isLink =
      block.url.startsWith("https://") || block.url.startsWith("http://");
    const childrenHTML = block.children
      .map((c, i) => inlineRenderer(c, i))
      .join("");

    if (isLink) {
      return `<a href="${block.url}" data-key="${index}">${childrenHTML}</a>`;
    } else {
      return "";
    }
  }

  return "";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const blocksStyle = `
.content {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  font-size: 16px;
  color: #000000ff;
}

.content p {
  margin: 0.75em 0;
}

.content h1,
.content h2,
.content h3,
.content h4,
.content h5,
.content h6 {
  margin: 1.2em 0 0.6em;
  font-weight: bold;
}

.content ul,
.content ol {
  margin: 1em 2.5em 1em 2.5em;
  padding: 0;
}

.content li {
  margin: 2em 0;
}

.content a {
  color: #0645ad;
  text-decoration: underline;
}

.content code {
  font-family: monospace;
  background: #f4f4f4;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.95em;
}

.content sup {
  font-size: 0.75em;
  line-height: 0;
}
`;
*/
