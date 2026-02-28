import WebKit
import UIKit

extension WKWebView {
    open override func canPerformAction(_ action: Selector, withSender sender: Any?) -> Bool {
        //disable contextual menu
        return false
    }
}
