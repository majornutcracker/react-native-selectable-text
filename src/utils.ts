import {
  classApplier,
  core,
  highlighter,
  saveStore,
  serializer,
  textRange,
} from "./rangy@1.3.2";
import {
  Action,
  HeadingBlock,
  LinkBlock,
  ListBlock,
  ListItemBlock,
  ParagraphBlock,
  RootBlocks,
  TextBlock,
} from "./types";

export const htmlContent = (
  blocks: RootBlocks | undefined,
  rerender: ((blocks: RootBlocks) => string) | undefined,
  actions: Action[] | undefined,
  cssStyle: string | undefined,
  platform: string,
  highlights: string | undefined
) => {
  const content = rerender ? rerender(blocks ?? []) : blocksRenderer(blocks);
  const parsedActions = parseActions(actions);
  const style = cssStyle ?? blocksStyle;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
   ${style}
    html, body {
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
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
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
    .noselect {
      -webkit-user-select: none;
      user-select: none;
    }
    .highlighted-text {
      background-color: yellow;
    }
  </style>
</head>
<body>
  ${content}
  <div class="tools noselect">
    ${parsedActions}
  </div>

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
    rangy.init();
    const myHighlighter = rangy.createHighlighter();
    myHighlighter.addClassApplier(
      rangy.createClassApplier('highlighted-text', {
        ignoreWhiteSpace: true,
        elementTagName: 'span',
        ignoreSelector: 'a, sup, .noselect'
      })
    );
    try {
      myHighlighter.deserialize('${highlights}');
    } catch (e) {
      console.warn("Failed to restore highlights", e);
    }
    document.documentElement.style.webkitUserSelect = 'text';
    document.documentElement.style.webkitTouchCallout = 'none';
    let selectedTextCache = '';
    let selectedRangeCache = [];
    const isIos = '${platform}' === 'ios';
    const isAndroid = '${platform}' === 'android';
    const isWeb = '${platform}' === 'web';
    const isNative = isAndroid || isIos;
    if (!window.x) {
      window.x = {};
    }

    x.Selector = {};
    x.Selector.getSelected = function() {
      let t = '';
      if (window.getSelection) {
        t = window.getSelection();
      } else if (document.getSelection) {
        t = document.getSelection();
      } else if (document.selection) {
        t = document.selection.createRange().text;
      }
      return t;
    };

    if (isAndroid) {
      document.addEventListener("message", function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "updateHighlights") {
            myHighlighter.removeAllHighlights();
            myHighlighter.deserialize(data.value);
          }
        } catch (e) {
          console.error("Error parsing", e);
        }
      });
    } else {
      window.addEventListener("message", function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "updateHighlights") {
            try {
              myHighlighter.removeAllHighlights();
              myHighlighter.deserialize(data.value);
            } catch (e) {
              console.error("Failed to restore highlights", e);
            }
          }
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      });
    }

    function hideMenu() {
      selectedTextCache = '';
      const toolsMenu = document.querySelector(".tools");
      toolsMenu.style.opacity = 0;
      toolsMenu.style.pointerEvents = 'none';
    }

    function showMenuAboveSelection() {
      const selection = x.Selector.getSelected();
      const toolsMenu = document.querySelector(".tools");

      if (!selection || selection.toString().trim() === "") {
        hideMenu();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const menuWidth = toolsMenu.offsetWidth;
      const menuHeight = toolsMenu.offsetHeight;

      let left = ((rect.left + rect.right) / 2) - (menuWidth / 2) + window.scrollX;
      let top = rect.top + window.scrollY - menuHeight - (isIos? 55 : 40);

      if (left < 0) left = 0;
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth;
      }

      if (top < 0) {
        top = rect.bottom;
      }
      if (top + menuHeight > window.innerHeight) {
        top = window.innerHeight - menuHeight;
      }

      toolsMenu.style.left = left + "px";
      toolsMenu.style.top = top + "px";
      toolsMenu.style.opacity = 1;
      toolsMenu.style.pointerEvents = 'auto';
    }

    function sendAction(action, e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!selectedTextCache) return;

      if ((action.value === 'highlight' || action.value === 'unhighlight')  && selectedRangeCache) {
        const sel = document.getSelection();
        sel.removeAllRanges();
        sel.addRange(selectedRangeCache);
        if (action.value === 'highlight') {
          highlightSelection();
        } else if (action.value === 'unhighlight') {
          const sel = rangy.getSelection();
          if (!sel.isCollapsed) {
            myHighlighter.unhighlightSelection();
          }
        }
      }
      if ( isNative && window.ReactNativeWebView) {
        if (action.value === 'highlight' || action.value === 'unhighlight') {
          window.ReactNativeWebView.postMessage(JSON.stringify({ action, selection: selectedTextCache, highlights: myHighlighter.serialize() }));
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({ action, selection: selectedTextCache, highlights: myHighlighter.serialize() }));
        }
      }
      else if ( isWeb && window.parent ) {
        if (action.value === 'highlight' || action.value === 'unhighlight') {
          window.parent.postMessage(
            JSON.stringify({ action, selection: selectedTextCache, highlights: myHighlighter.serialize() }),
            "*"
          );
        } else {
          window.parent.postMessage(
            JSON.stringify({ action, selection: selectedTextCache, highlights: myHighlighter.serialize() }),
            "*"
          );
        }
      }
      hideMenu();
    }

    document.addEventListener("contextmenu", function(e) {
      e.preventDefault();
      showMenuAboveSelection();
    });

    document.addEventListener("selectionchange", function(e) {
      e.preventDefault();
      const selection = x.Selector.getSelected();
      if (!selection || selection.toString().trim() === "") {
        selectedTextCache = '';
        selectedRangeCache = null;
        hideMenu();
        return;
      }
      selectedTextCache = selection.toString();
      if (selection.rangeCount > 0) {
        selectedRangeCache = selection.getRangeAt(0).cloneRange();
      }
      showMenuAboveSelection();
    });

    function highlightSelection() {
      const sel = rangy.getSelection();
      if (!sel.isCollapsed) {
        myHighlighter.highlightSelection('highlighted-text');
      }
    }

    true;
  </script>
</body>
</html>
`;
};

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

function blocksRenderer(content: RootBlocks | undefined): string {
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
    const isNote = block.url.startsWith("note://");
    const isLink =
      block.url.startsWith("https://") || block.url.startsWith("http://");
    const childrenHTML = block.children
      .map((c, i) => inlineRenderer(c, i))
      .join("");

    if (isLink) {
      return `<a href="${block.url}" data-key="${index}">${childrenHTML}</a>`;
    } else if (isNote) {
      const noteId = block.url.replace("note://", "");
      return `<sup class="noselect" id="note-ref-${noteId}" data-key="${index}"><a href="${block.url}">${childrenHTML}</a></sup>`;
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

  .content h1, .content h2, .content h3,
  .content h4, .content h5, .content h6 {
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

  .noselect {
    -webkit-user-select: none;
    user-select: none;
  }
`;
