import { NativeModule, requireNativeModule } from "expo";

declare class MajornutcrackerReactNativeSelectableTextModule extends NativeModule {
  version: string;
  /**
   * iOS only. Enables or disables the contextual menu on all selectable text views. When disabled, users won't be able to select text or see the copy/paste menu.
   * @param enabled
   */
  setMenuEnabled(enabled: boolean): void;
}

export default requireNativeModule<MajornutcrackerReactNativeSelectableTextModule>(
  "MajornutcrackerReactNativeSelectableText"
);
