//
//  WebOrbView.swift
//  DearFutureMe  ←  APP TARGET ONLY
//
//  Hosts the WebGL "voice orb" (Three.js + GLSL, MIT-licensed, adapted from
//  github.com/aguscruiz/voiceorb — see WebOrb/VOICEORB_LICENSE_ATTRIBUTION.md)
//  inside a transparent WKWebView so it sits on the cream app background.
//
//  The web page exposes a global `setState('idle'|'listening'|'thinking'|
//  'speaking')`. This view maps the app's SessionState onto that and calls it
//  via `evaluateJavaScript` whenever the state changes. All rendering happens
//  in the web view; Swift only tells it which state to be in.
//

import SwiftUI
import WebKit

struct WebOrbView: UIViewRepresentable {

    /// The conversation phase to render.
    var state: SessionState

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: config)
        // Transparent so the cream paper shows through the orb's alpha canvas.
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        // Keep the page's box identical to this view's frame. These settle the
        // scroll view; the *layout viewport* is settled separately, by
        // `viewport-fit=cover` in WebOrb/index.html — without that meta, WebKit
        // insets the viewport by the safe area no matter what is done here, and
        // the orb drifts off-centre and clips.
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.contentInset = .zero
        webView.scrollView.verticalScrollIndicatorInsets = .zero
        webView.scrollView.bounces = false
        // Taps belong to the SwiftUI orb button behind/over this view.
        webView.isUserInteractionEnabled = false
        webView.navigationDelegate = context.coordinator

        if let dir = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebOrb")
            ?? Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(dir, allowingReadAccessTo: dir.deletingLastPathComponent())
        }
        context.coordinator.webView = webView
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        context.coordinator.apply(state: state)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        weak var webView: WKWebView?
        private var loaded = false
        private var pending: SessionState?
        private var lastSent: String?

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            loaded = true
            if let pending { apply(state: pending) }
        }

        func apply(state: SessionState) {
            guard loaded else { pending = state; return }
            let name = Self.jsName(state)
            guard name != lastSent else { return }
            lastSent = name
            webView?.evaluateJavaScript("if(window.setState){setState('\(name)');}", completionHandler: nil)
        }

        private static func jsName(_ state: SessionState) -> String {
            switch state {
            case .idle: return "idle"
            case .listening: return "listening"
            case .thinking: return "thinking"
            case .speaking: return "speaking"
            }
        }
    }
}
