import { NativeModule, requireNativeModule } from "expo";

declare class MajornutcrackerReactNativeSelectableTextModule extends NativeModule {
  version: string;
}

export default requireNativeModule<MajornutcrackerReactNativeSelectableTextModule>(
  "MajornutcrackerReactNativeSelectableText"
);
