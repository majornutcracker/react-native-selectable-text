import { registerWebModule, NativeModule } from "expo";

import { MajornutcrackerReactNativeSelectableTextModuleEvents } from "./MajornutcrackerReactNativeSelectableText.types";

class MajornutcrackerReactNativeSelectableTextModule extends NativeModule<MajornutcrackerReactNativeSelectableTextModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit("onChange", { value });
  }
  hello() {
    return "Hello world! 👋";
  }
}

export default registerWebModule(
  MajornutcrackerReactNativeSelectableTextModule,
  "MajornutcrackerReactNativeSelectableTextModule"
);
