//
//  DearFutureMeApp.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target). This file contains the `@main`
//  entry point, so it must NOT be added to the widget extension target.
//
//  The app opens straight onto the voice session. There is no menu, no tab bar
//  and no onboarding wall in front of the microphone — FUTURE_PLAN.md §2A:
//  "Do not force users through menus before speaking."
//
//  Three things can ask for a listening session, and they all funnel into one
//  counter:
//
//    1. Launching the app and tapping the orb (handled inside VoiceSessionView).
//    2. The deep link `dearfutureme://talk` — from the Home/Lock Screen widget's
//       `.widgetURL(...)`, or from Safari during testing.
//    3. A `.dfmStartListening` notification — posted by the App Intent target
//       (`TalkIntent`, another agent's file) once the app is foregrounded.
//
//  XCODE SETUP REQUIRED (tomorrow):
//    - Info → URL Types → add scheme `dearfutureme`.
//    - Info.plist → NSMicrophoneUsageDescription, NSSpeechRecognitionUsageDescription.
//    - Info.plist → UIAppFonts: Comfortaa.ttf, Caveat.ttf.
//

import SwiftUI
import Combine

// MARK: - Cross-target notification name

extension Notification.Name {
    /// Posted to ask the app to open a listening session immediately.
    ///
    /// Declared here, in the app target, because the App Intent that posts it
    /// runs in-process (`openAppWhenRun = true`). Post it like this:
    ///
    ///     NotificationCenter.default.post(name: .dfmStartListening, object: nil)
    ///
    /// or call `DFMSessionLauncher.requestStartListening()`.
    static let dfmStartListening = Notification.Name("DFMStartListening")
}

/// Convenience wrapper so App Intents and other entry points do not have to
/// remember the notification plumbing.
enum DFMSessionLauncher {

    /// The deep link the widget uses.
    static let talkURLString = "dearfutureme://talk"

    /// Asks the running app to start listening now.
    static func requestStartListening() {
        NotificationCenter.default.post(name: .dfmStartListening, object: nil)
    }
}

// MARK: - App

@main
struct DearFutureMeApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

// MARK: - Root

/// Wraps the voice session with the only chrome the app has: a notebook on the
/// left, a gear on the right, and the orb between them. Browsing is one tap
/// away and never in the way — the voice screen is still what launches.
///
/// Intentionally NOT annotated `@MainActor`: its only stored state is two
/// trivial `@State` counters, and leaving it unannotated keeps the
/// `.onOpenURL` / `.onReceive` action closures free of isolation friction.
/// (`body` is main-actor isolated regardless, via the `View` protocol.)
struct RootView: View {

    /// Increments every time something asks for a listening session.
    @State private var startRequests: Int = 0

    /// What the current start request was reaching for, if anything.
    /// Read once by `VoiceSessionView` when it acts on `startRequests`.
    @State private var entryIntent: DFMEntryIntent?

    @State private var showSettings: Bool = false

    /// The browse surface. Deliberately a full-screen cover reached by one tap
    /// from the orb screen — never a step *before* it (FUTURE_PLAN.md §2A).
    @State private var showNotebook: Bool = false

    /// First launch creates the user's DFM account in-app instead of sending
    /// them to the website to copy a key.
    @State private var showOnboarding: Bool = DFMConfig.dfmAPIKey.isEmpty

    var body: some View {
        VoiceSessionView(startRequests: startRequests, entryIntent: entryIntent)
            .overlay(alignment: .topTrailing) {
                settingsButton
            }
            .overlay(alignment: .topLeading) {
                notebookButton
            }
            // The palette is cream-and-green by design; dark mode would fight it.
            .preferredColorScheme(.light)
            .tint(DFMTheme.leafGreen)
            .onAppear {
                // Cold launch from Siri / Action Button: WriteLetterIntent wrote
                // the key before this view existed.
                if let pending = DFMEntryIntent.consumePending() {
                    entryIntent = pending
                }
            }
            .onOpenURL { url in
                handleDeepLink(url)
            }
            .onReceive(NotificationCenter.default.publisher(for: .dfmStartListening)) { _ in
                // Warm launch from Siri / Action Button: the key was written
                // immediately before this notification was posted.
                entryIntent = DFMEntryIntent.consumePending()
                startRequests += 1
            }
            .sheet(isPresented: $showSettings) {
                // CONTRACT: `struct SettingsView: View` with a no-argument
                // initialiser, written by another agent in SettingsView.swift.
                SettingsView()
            }
            .fullScreenCover(isPresented: $showNotebook) {
                NotebookView()
            }
            .fullScreenCover(isPresented: $showOnboarding) {
                OnboardingView { needsSettings in
                    showOnboarding = false
                    if needsSettings {
                        // Let the full-screen cover finish dismissing before
                        // presenting Settings for an existing/voice-model key.
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            showSettings = true
                        }
                    } else {
                        startRequests += 1
                    }
                }
            }
    }

    // MARK: Chrome

    private var settingsButton: some View {
        chromeButton(symbol: "gearshape", label: "Settings") {
            showSettings = true
        }
        .padding(.trailing, 22.0)
        .padding(.top, 12.0)
    }

    /// The notebook, mirroring the gear across the screen. Same size, same
    /// border, same shadow — two equal affordances flanking the orb, so neither
    /// reads as the main event. The orb still is.
    private var notebookButton: some View {
        chromeButton(symbol: "book.closed", label: "Notebook") {
            showNotebook = true
        }
        .padding(.leading, 22.0)
        .padding(.top, 12.0)
    }

    /// The one piece of chrome styling in the app.
    private func chromeButton(
        symbol: String,
        label: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 17.0, weight: .medium))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.7))
                .frame(width: 42.0, height: 42.0)
                .background {
                    Circle()
                        .fill(DFMTheme.cream.opacity(0.85))
                        .overlay {
                            Circle().strokeBorder(
                                DFMTheme.leafGreen.opacity(0.25),
                                lineWidth: 2.0
                            )
                        }
                }
                .shadow(color: DFMTheme.shadowSoft, radius: 10.0, x: 0.0, y: 4.0)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(label))
    }

    // MARK: Deep links

    /// Accepts `dearfutureme://talk` (and the `dearfutureme:///talk` spelling
    /// some launchers produce), with an optional `?intent=proud|letter|memory`
    /// from the medium/large widget CTAs. Anything else is ignored rather than
    /// treated as a start request.
    private func handleDeepLink(_ url: URL) {
        guard url.scheme?.lowercased() == "dearfutureme" else { return }

        let host = url.host?.lowercased() ?? ""
        let path = url.path.lowercased()

        if host == "talk" || path == "/talk" || (host.isEmpty && path.isEmpty) {
            // Set the intent BEFORE bumping the counter: the counter is what
            // VoiceSessionView watches, and it reads the intent in the same tick.
            entryIntent = DFMEntryIntent.from(url: url)
            startRequests += 1
        }
    }
}
