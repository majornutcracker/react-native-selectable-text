package com.majornutcracker.reactnativeselectablewebview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MajornutcrackerReactNativeSelectableTextModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MajornutcrackerReactNativeSelectableText")

    Constant("version") {
      "1.0.0"
    }

    Function("setMenuEnabled") { enabled: Boolean ->
      // Implementation would go here
    }
  }
}
