import {
  ColorClass,
  ColorClassName,
} from "@majornutcracker/react-native-selectable-text";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

const FAB_ITEM_SIZE = 44;
const FAB_ITEM_GAP = 12;
const FAB_BOTTOM = 96;

type ColorFabProps = {
  colorClasses: ColorClass[];
  currentColorClassName: ColorClassName;
  setCurrentColorClassName: Dispatch<SetStateAction<ColorClassName>>;
};

export function ColorFab(props: ColorFabProps) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const currentColor =
    props.colorClasses.find((c) => c.name === props.currentColorClassName)
      ?.color ?? "#94A3B8";

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  }, [expanded, expandAnim]);

  const toggleExpanded = () => {
    setExpanded((value) => !value);
  };

  const selectColor = (colorClassName: ColorClassName) => {
    props.setCurrentColorClassName(colorClassName);
    setExpanded(false);
  };

  const mainRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View style={styles.fabRoot} pointerEvents="box-none">
      {expanded ? (
        <Pressable
          style={styles.fabBackdrop}
          onPress={() => setExpanded(false)}
        />
      ) : null}

      <View style={styles.colorFabStack} pointerEvents="box-none">
        {props.colorClasses.map((colorClass, index) => {
          const isCurrent = colorClass.name === props.currentColorClassName;
          const staggerStart = index * 0.08;
          const itemProgress = expandAnim.interpolate({
            inputRange: [0, staggerStart, staggerStart + 0.55, 1],
            outputRange: [0, 0, 0.6, 1],
            extrapolate: "clamp",
          });
          const translateY = itemProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(index + 1) * (FAB_ITEM_SIZE + FAB_ITEM_GAP)],
          });
          const scale = itemProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
          });
          const opacity = itemProgress;

          return (
            <Animated.View
              key={colorClass.name}
              pointerEvents={expanded ? "auto" : "none"}
              style={[
                styles.fabItemSlot,
                {
                  opacity,
                  transform: [{ translateY }, { scale }],
                },
              ]}
            >
              <ColorSwatch
                color={colorClass.color}
                selected={isCurrent}
                onPress={() => selectColor(colorClass.name)}
              />
            </Animated.View>
          );
        })}

        <View style={styles.fabMainShadow}>
          <Pressable
            onPress={toggleExpanded}
            style={({ pressed }) => [
              styles.fabMain,
              { backgroundColor: currentColor },
              pressed && styles.fabMainPressed,
            ]}
          >
            <Animated.View
              style={[
                styles.fabMainIcon,
                { transform: [{ rotate: mainRotation }] },
              ]}
            >
              <View style={styles.fabMainIconBarH} />
              <View style={styles.fabMainIconBarV} />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ColorSwatch(props: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;

  const animatePress = (toValue: number) => {
    Animated.spring(pressScale, {
      toValue,
      useNativeDriver: true,
      friction: 5,
      tension: 300,
    }).start();
  };

  return (
    <Pressable
      onPress={props.onPress}
      onPressIn={() => animatePress(0.85)}
      onPressOut={() => animatePress(1)}
    >
      <Animated.View
        style={[
          styles.fabSwatchOuter,
          props.selected && styles.fabSwatchOuterSelected,
          { transform: [{ scale: pressScale }] },
        ]}
      >
        <View style={[styles.fabSwatch, { backgroundColor: props.color }]}>
          {props.selected ? <View style={styles.fabSwatchCheck} /> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fabRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
  },
  colorFabStack: {
    position: "absolute",
    right: 24,
    bottom: FAB_BOTTOM,
    alignItems: "center",
    width: FAB_ITEM_SIZE,
  },
  fabItemSlot: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
  },
  fabMainShadow: {
    borderRadius: FAB_ITEM_SIZE / 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 12,
  },
  fabMain: {
    width: FAB_ITEM_SIZE + 8,
    height: FAB_ITEM_SIZE + 8,
    borderRadius: (FAB_ITEM_SIZE + 8) / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  fabMainPressed: {
    opacity: 0.92,
  },
  fabMainIcon: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fabMainIconBarH: {
    position: "absolute",
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  fabMainIconBarV: {
    position: "absolute",
    width: 2.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  fabSwatchOuter: {
    padding: 3,
    borderRadius: FAB_ITEM_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  fabSwatchOuterSelected: {
    padding: 4,
    borderWidth: 2,
    borderColor: "#0F172A",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabSwatch: {
    width: FAB_ITEM_SIZE - 6,
    height: FAB_ITEM_SIZE - 6,
    borderRadius: (FAB_ITEM_SIZE - 6) / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.12)",
  },
  fabSwatchCheck: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: "rgba(15, 23, 42, 0.7)",
    transform: [{ rotate: "-45deg" }, { translateY: -1 }],
  },
});
