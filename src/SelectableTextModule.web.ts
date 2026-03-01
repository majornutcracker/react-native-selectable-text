import { registerWebModule, NativeModule } from "expo";

class MajornutcrackerReactNativeSelectableTextModule extends NativeModule {
  version = "1.0.0";
  setMenuEnabled(enabled: boolean) {
    console.warn(
      `Menu enabled is ios only. Ignoring setMenuEnabled(${enabled}) call on web.`
    );
  }
}

export default registerWebModule(
  MajornutcrackerReactNativeSelectableTextModule,
  "MajornutcrackerReactNativeSelectableTextModule"
);
