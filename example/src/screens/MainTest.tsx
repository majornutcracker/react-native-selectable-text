import {
  SelectableTextView,
  HTMLString,
  SelectableTextViewRef,
  ColorClass,
  CSSString,
  ColorClassName,
} from "@majornutcracker/react-native-selectable-text";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Button,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const guideContent: HTMLString = `
<article class="content">
  <header>
    <h1>SelectableTextView demo</h1>
    <p>
      HTML rendered in a WebView with native selection, Rangy highlights, and a bridge to React Native.
      Pick a color with the FAB, select text, then use the system menu or the action buttons above.
    </p>
  </header>

  <main>
    <section aria-labelledby="props">
      <h2 id="props">Props</h2>
      <dl>
        <dt><code>content</code></dt>
        <dd>This article is the HTML string passed to the component.</dd>
        <dt><code>css</code></dt>
        <dd>Injected styles for layout and typography (<code>.content</code>).</dd>
        <dt><code>colorClasses</code></dt>
        <dd>Named highlight classes; the FAB switches the active one for <code>highlightSelection</code>.</dd>
        <dt><code>highlights</code></dt>
        <dd>Optional serialized state to restore highlights when the screen remounts.</dd>
        <dt><code>highlighterOptions</code></dt>
        <dd>
          <code>overlapping</code>, <code>ignoreWhiteSpace</code>, and
          <code>ignoredElements</code> (tags or classes such as <code>a</code>, <code>sup</code>, <code>.no-select</code>).
        </dd>
      </dl>
    </section>

    <section aria-labelledby="callbacks">
      <h2 id="callbacks">Callbacks</h2>
      <ul>
        <li><code>onTextSelectionChange</code> — logs the current selection (see Metro).</li>
        <li><code>onHighlightsChange</code> — logs the serialized highlight payload after each change.</li>
        <li><code>onLink</code> — handles link taps; try the sample link in the section below.</li>
      </ul>
    </section>

    <section aria-labelledby="ref">
      <h2 id="ref">Ref API</h2>
      <ul>
        <li><code>highlightSelection(colorClassName?)</code> — applies the active color to the cached selection.</li>
        <li><code>unhighlightSelection()</code> — removes highlight from the cached selection.</li>
        <li><code>getSelectedText()</code> — returns the cached selected text (Actions button).</li>
        <li><code>getHighlights()</code> — returns the serialized highlights string (Actions button).</li>
      </ul>
    </section>

    <section aria-labelledby="ignored">
      <h2 id="ignored">Ignored elements</h2>
      <p>
        Default ignored tags: <code>a</code>, <code>sup</code>, <code>sub</code>, plus headings in this demo.
        Select across normal text and these nodes — highlights should skip them visually.
      </p>
      <p>
        Chemistry sample: H<sub>2</sub>O and E = mc<sup>2</sup> inside a longer sentence for cross-selection tests.
      </p>
      <p class="no-select">
        This paragraph uses <code>.no-select</code> and should not receive a visible highlight.
      </p>
    </section>

    <section aria-labelledby="try">
      <h2 id="try">Try selection</h2>
      <p>
        Drag a selection across multiple lines. Use Highlight / Unhighlight from the native menu
        or switch colors with the FAB and highlight again.
      </p>
      <ul>
        <li>List item with x<sup>2</sup> notation.</li>
        <li>Second item with CO<sub>2</sub> for multi-line ranges.</li>
      </ul>
      <p>
        Inline code: <code>highlightSelection</code> and <code>unhighlightSelection</code> are also exposed on the ref.
      </p>
    </section>

    <section aria-labelledby="links">
      <h2 id="links">Links</h2>
      <p>
        External navigation is handled in <code>onLink</code>:
        <a href="https://www.google.com">open via Linking</a>.
      </p>
    </section>
  </main>

  <footer>
    <p>Example screen — not production content.</p>
  </footer>
</article>
`;

const cssContent: CSSString = `
.content {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  font-size: 14px;
}
.content section {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e5e5;
}
.content section:last-of-type {
  border-bottom: none;
}
.content h2 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}
.content dl {
  margin: 0;
}
.content dt {
  font-weight: 600;
  margin-top: 0.5rem;
}
.content dt:first-child {
  margin-top: 0;
}
.content dd {
  margin: 0.15rem 0 0 0;
  color: #444;
}
.content code {
  font-family: ui-monospace, monospace;
  font-size: 0.9em;
  background: #f4f4f4;
  padding: 0.1em 0.35em;
  border-radius: 3px;
}
.content a {
  color: #0645ad;
}
`;

const colorClasses: ColorClass[] = [
  { name: "custom-highlight", color: "red" },
  { name: "custom-highlight-2", color: "#fe8080" },
];

export default function MainTest() {
  const router = useRouter();
  const selectableTextViewRef = useRef<SelectableTextViewRef>(null);
  const [currentColorClassName, setCurrentColorClassName] =
    useState<ColorClassName>(colorClasses[0].name);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Module API Example</Text>
      <Group name="Actions">
        <View style={styles.actionsContainer}>
          <Button
            title="Get Highlights"
            onPress={async () => {
              const highlights =
                await selectableTextViewRef.current?.getHighlights();
              Alert.alert("Highlights", JSON.stringify(highlights));
            }}
          />
          <Button
            title="Get Selected Text"
            onPress={async () => {
              const selectedText =
                await selectableTextViewRef.current?.getSelectedText();
              Alert.alert("Selected Text", JSON.stringify(selectedText));
            }}
          />
        </View>
      </Group>
      <Group name="SelectableTextView" flex>
        <SelectableTextView
          ref={selectableTextViewRef}
          webViewProps={{
            style: styles.selectableText,
            menuItems: [
              {
                key: "highlight",
                label: "Highlight",
              },
              {
                key: "unhighlight",
                label: "Unhighlight",
              },
            ],
            onCustomMenuSelection: (event) => {
              const key = event.nativeEvent.key;
              if (key === "highlight") {
                selectableTextViewRef.current?.highlightSelection(
                  currentColorClassName
                );
              } else if (key === "unhighlight") {
                selectableTextViewRef.current?.unhighlightSelection();
              }
            },
          }}
          colorClasses={colorClasses}
          content={guideContent}
          css={cssContent}
          highlighterOptions={{
            overlapping: false,
            ignoreWhiteSpace: true,
            ignoredElements: [
              "a",
              "sup",
              "sub",
              ".no-select",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
            ],
          }}
          onLink={(url) => {
            console.log("link", url);
            Linking.openURL(url);
          }}
          onTextSelectionChange={(selectedText) => {
            console.log("textSelectionChange", selectedText);
          }}
          onHighlightsChange={(highlights) => {
            console.log("highlights", highlights);
          }}
        />
      </Group>
      <Fab
        colorClasses={colorClasses}
        currentColorClassName={currentColorClassName}
        setCurrentColorClassName={setCurrentColorClassName}
      />
      <Button
        title="Go to Home"
        onPress={() => {
          router.push("/home");
        }}
      />
    </SafeAreaView>
  );
}

function Group(props: {
  name: string;
  children: React.ReactNode;
  flex?: boolean;
}) {
  return (
    <View style={[styles.group, props.flex ? { flex: 1 } : {}]}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

function Fab(props: {
  colorClasses: ColorClass[];
  currentColorClassName: ColorClassName;
  setCurrentColorClassName: (colorClassName: ColorClassName) => void;
}) {
  return (
    <View style={styles.colorClassesContainer}>
      {props.colorClasses.map((colorClass) => {
        const isCurrent = colorClass.name === props.currentColorClassName;
        return (
          <TouchableOpacity
            key={colorClass.name}
            onPress={() => props.setCurrentColorClassName(colorClass.name)}
            style={[styles.fabButton, isCurrent ? styles.fabButtonCurrent : {}]}
          >
            <View
              style={[
                styles.fabButtonColor,
                { backgroundColor: colorClass.color },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#eee",
  },
  selectableText: {
    flex: 1,
  },
  colorClassesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fabButton: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  fabButtonColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fabButtonCurrent: {
    borderWidth: 2,
    borderColor: "black",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
});
