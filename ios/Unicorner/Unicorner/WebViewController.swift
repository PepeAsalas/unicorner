import UIKit
import WebKit

/// Shows unicornergame.lol and connects the page to Apple payments.
///
/// The page talks to the app with
///   window.webkit.messageHandlers.ucIAP.postMessage({action: "products" | "buy" | "restore" | "entitlements", product, account})
/// and the app answers by calling window.ucIAPResult(message) on the page.
@MainActor
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    static let home = URL(string: "https://unicornergame.lol/?source=ios")!
    static let ownHosts: Set<String> = ["unicornergame.lol", "www.unicornergame.lol"]

    private var web: WKWebView!
    private let store = IAPStore()

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.applicationNameForUserAgent = "Mobile/15E148 UnicornerIOS/1.0"

        // Tell the page it runs inside the iPhone app before any of its scripts start.
        let flag = "window.UC_IOS_APP=true;try{localStorage.setItem('uc-ios-app','1')}catch(e){}"
        config.userContentController.addUserScript(
            WKUserScript(source: flag, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        config.userContentController.add(WeakHandler(self), name: "ucIAP")

        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.uiDelegate = self
        web.allowsBackForwardNavigationGestures = true
        web.isOpaque = false
        web.backgroundColor = UIColor(named: "LaunchBg")
        web.scrollView.backgroundColor = UIColor(named: "LaunchBg")
        web.scrollView.contentInsetAdjustmentBehavior = .automatic

        let refresh = UIRefreshControl()
        refresh.tintColor = .white
        refresh.addTarget(self, action: #selector(reload(_:)), for: .valueChanged)
        web.scrollView.refreshControl = refresh

        let root = UIView()
        root.backgroundColor = UIColor(named: "LaunchBg")
        web.translatesAutoresizingMaskIntoConstraints = false
        root.addSubview(web)
        NSLayoutConstraint.activate([
            web.topAnchor.constraint(equalTo: root.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: root.bottomAnchor),
            web.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: root.trailingAnchor),
        ])
        view = root

        store.send = { [weak self] message in self?.deliver(message) }
        web.load(URLRequest(url: Self.home))
    }

    @objc private func reload(_ sender: UIRefreshControl) {
        web.reload()
        sender.endRefreshing()
    }

    // MARK: Page -> app

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let action = body["action"] as? String else { return }
        let product = body["product"] as? String
        let account = body["account"] as? String
        Task {
            switch action {
            case "products": await store.loadProducts()
            case "buy": if let product { await store.buy(product, account: account) }
            case "restore": await store.restore()
            case "entitlements": await store.sendEntitlements()
            default: break
            }
        }
    }

    // MARK: App -> page

    private func deliver(_ message: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: message),
              let json = String(data: data, encoding: .utf8) else { return }
        web.evaluateJavaScript("window.ucIAPResult&&window.ucIAPResult(\(json))", completionHandler: nil)
    }

    // MARK: Links: our site stays in the app, everything else opens in Safari

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { return decisionHandler(.allow) }
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == "about" || scheme == "blob" || scheme == "data" { return decisionHandler(.allow) }
        if scheme == "mailto" || scheme == "tel" || scheme == "sms" {
            UIApplication.shared.open(url)
            return decisionHandler(.cancel)
        }
        let isMainFrame = action.targetFrame?.isMainFrame ?? true
        if isMainFrame, let host = url.host?.lowercased(), !Self.ownHosts.contains(host) {
            UIApplication.shared.open(url)
            return decisionHandler(.cancel)
        }
        decisionHandler(.allow)
    }

    // target=_blank links
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url {
            if let host = url.host?.lowercased(), Self.ownHosts.contains(host) {
                webView.load(URLRequest(url: url))
            } else {
                UIApplication.shared.open(url)
            }
        }
        return nil
    }

    // If the page fails to load (no internet), show a simple retry screen.
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        // Only for real network problems: a link we sent to Safari also lands here, as a cancelled load.
        let e = error as NSError
        guard e.domain == NSURLErrorDomain, e.code != NSURLErrorCancelled else { return }
        let html = """
        <html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;background:#1d1a2b;color:#fff;font:20px -apple-system;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center">
        <div><p>No connection.</p><button onclick="location.href='\(Self.home.absoluteString)'"
        style="font:20px -apple-system;padding:12px 24px;border:3px solid #000;background:#f2c230">Try again</button></div></body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    // JavaScript alert / confirm / prompt
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        a.addTextField { $0.text = defaultText }
        a.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(nil) })
        a.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(a.textFields?.first?.text) })
        present(a, animated: true)
    }
}

/// Stops the web view and this controller from keeping each other alive.
private final class WeakHandler: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        target?.userContentController(c, didReceive: m)
    }
}
