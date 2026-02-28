import { requireNativeView } from "expo";
import * as React from "react";

import { MajornutcrackerReactNativeSelectableTextViewProps } from "./MajornutcrackerReactNativeSelectableText.types";

const NativeView: React.ComponentType<MajornutcrackerReactNativeSelectableTextViewProps> =
  requireNativeView("MajornutcrackerReactNativeSelectableText");

export default function MajornutcrackerReactNativeSelectableTextView(
  props: MajornutcrackerReactNativeSelectableTextViewProps
) {
  return <NativeView {...props} />;
}
