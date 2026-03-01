import ExpoModulesCore

public class MajornutcrackerReactNativeSelectableTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MajornutcrackerReactNativeSelectableText")

    Constant("version") {
      "1.0.0"
    }

    Function("hello") {
      WKWebView.isMenuEnabledGlobal.toggle()
    }
  }
}
