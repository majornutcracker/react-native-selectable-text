import ExpoModulesCore
import WebKit

public class MajornutcrackerReactNativeSelectableTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MajornutcrackerReactNativeSelectableText")

    Constant("version") {
      "1.0.0"
    }

    Function("setMenuEnabled") { (enabled: Bool) in
      WKWebView.isMenuEnabledGlobal(enabled)
    }
  }
}
