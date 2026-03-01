import WebKit
import UIKit

extension WKWebView {
  static var isMenuEnabledGlobal: Bool = true

  open override func canPerformAction(_ action: Selector, withSender sender: Any?) -> Bool {
    if !WKWebView.isMenuEnabledGlobal {
      return false
    }
    return super.canPerformAction(action, withSender: sender)
  }
}