import SelectableTextViewModule, {
  RootBlocks,
  SelectableTextView,
} from "@majornutcracker/react-native-selectable-text";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const guideContent: RootBlocks = [
  // 1. Heading Block
  {
    type: "heading",
    level: 1,
    children: [
      {
        type: "text",
        text: "Getting Started with SDK",
        bold: true,
      },
    ],
  },

  // 2. Paragraph Block with Inline Link and Formatting
  {
    type: "paragraph",
    children: [
      {
        type: "text",
        text: "Before you begin, please read our ",
      },
      {
        type: "link",
        url: "https://docs.example.com/terms",
        children: [
          {
            type: "text",
            text: "Terms of Service",
            underline: true,
            italic: true,
          },
        ],
      },
      {
        type: "text",
        text: ". It is mandatory for all developers.",
      },
    ],
  },

  // 3. List Block (Unordered) showing nested List Items and Code
  {
    type: "list",
    format: "unordered",
    children: [
      {
        type: "list-item",
        children: [
          {
            type: "text",
            text: "Install the package via ",
          },
          {
            type: "text",
            text: "npm install @majornutcracker/react-native-selectable-text",
            code: true,
          },
        ],
      },
      {
        type: "list-item",
        children: [
          {
            type: "text",
            text: "Configure your ",
          },
          {
            type: "text",
            text: "API_KEY",
            bold: true,
          },
          {
            type: "text",
            text: " in the root directory.",
          },
        ],
      },
    ],
  },

  // 4. Heading Level 2
  {
    type: "heading",
    level: 2,
    children: [
      {
        type: "text",
        text: "Legacy Methods",
        strikethrough: true, // Deprecated section
      },
    ],
  },

  // 5. Action Example (Stand-alone interface)
  {
    type: "paragraph",
    children: [
      {
        type: "text",
        text: "Once finished, click the button below.",
      },
    ],
  },
];

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Module API Example</Text>
      <Group name="Version">
        <Text>{SelectableTextViewModule.version}</Text>
      </Group>
      <Group name="SelectableTextView" flex>
        <SelectableTextView blocks={guideContent} />
      </Group>
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

const styles = {
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
};
