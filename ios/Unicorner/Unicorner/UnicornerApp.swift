import SwiftUI

@main
struct UnicornerApp: App {
    var body: some Scene {
        WindowGroup {
            WebScreen()
                .background(Color("LaunchBg"))
                .ignoresSafeArea(.container, edges: .bottom)
                .preferredColorScheme(.dark)
        }
    }
}

struct WebScreen: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> WebViewController { WebViewController() }
    func updateUIViewController(_ vc: WebViewController, context: Context) {}
}
