import SelectableTextViewModule, {
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
    <h1>@majornutcracker/react-native-selectable-text</h1>
    <p>
      This screen exercises the SelectableTextView example: HTML inside a WebView,
      native text selection, and optional highlights you can apply from the system menu.
      Demo build <sup>v1.0</sup>.
    </p>
    <p>
      The library is a MajorNutcracker add-on for React Native. It targets apps that need
      richer selection than a plain Text component, without giving up a familiar document layout.
      See note<sub>1</sub> for ignored elements during highlighting.
    </p>
  </header>
  <main>
    <section aria-labelledby="s1">
      <h2 id="s1">What it does</h2>
      <p>
        Content is rendered as HTML in react-native-webview. Rangy runs in the page to manage
        highlight spans and serialization, so highlights can be saved, restored, and kept in sync
        when your screen state changes. Example: H<sub>2</sub>O and E = mc<sup>2</sup>.
      </p>
      <p>
        A thin native bridge (Swift on iOS, Kotlin on Android) carries messages between the WebView
        and React. That keeps selection flows and highlight updates predictable on both platforms.
      </p>
    </section>
    <section aria-labelledby="s2">
      <h2 id="s2">Try it here</h2>
      <p>
        Select any phrase below, then use the custom menu actions to highlight or unhighlight.
        The sample logs highlight payloads through onHighlightsChange so you can see the serialized state.
      </p>
      <ul>
        <li>Short list item for nested selection with x<sup>2</sup> notation.</li>
        <li>Another line with CO<sub>2</sub> to drag a multi-line selection across.</li>
      </ul>
    </section>
    <section aria-labelledby="s3">
      <h2 id="s3">Expo and the module API</h2>
      <p>
        The package ships as an Expo module, so it fits Expo Router projects and bare workflows
        that already use autolinking. You pass HTML, optional CSS, color classes, and initial highlights;
        the ref exposes imperative helpers for highlight and unhighlight when you wire custom UI.
        API ref<sup>3</sup> covers <code>highlightSelection</code> and <code>unhighlightSelection</code>.
      </p>
    </section>
  </main>
  <aside>
    <h2>External link</h2>
    <p>
      Links still work: <a href="https://www.google.com">open in the app handler</a> unless you override onLink.
    </p>
  </aside>
  <footer>
    <p>Demo content for local development only. <sub>1</sub> Default ignored elements: a, sup, sub.</p>
  </footer>
</article>
`;

const cssContent: CSSString = `
.content {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  font-size: 14px;
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
            ignoredElements: ["a", "sup", "sub"],
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
