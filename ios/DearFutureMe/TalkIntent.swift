//
//  TalkIntent.swift
//  DearFutureMe  ←  APP TARGET ONLY (never the DFMWidget target)
//
//  Dear Future Me — Voice OS hackathon, Phase 8: Siri / Spotlight / Action Button
//  entry into the same already-listening session the widget opens.
//
//  Contract with the rest of the app target:
//    • `Notification.Name.dfmStartListening` is declared in DearFutureMeApp.swift.
//      This file only posts it — it must NOT re-declare it (duplicate declaration
//      in the same module is a compile error).
//    • Whoever observes `.dfmStartListening` starts the microphone. That is the
//      same observer the `dearfutureme://talk` deep link feeds.
//
//  Why `openAppWhenRun = true` (VOICE_OS_PLAN.md §0.3): an intent that does not
//  foreground the app runs in the background, where there is no UI, no audio
//  session hand-off, and nothing to listen with. The whole pitch is "it is
//  already listening when you look at it", so the app must come forward.
//
//  Action Button: iOS does not expose an API for it. The user binds our App
//  Shortcut manually — Settings > Action Button > Shortcut > "Talk". That step is
//  in ios/IOS_RUNBOOK.md §7.
//

import AppIntents
import Foundation

struct TalkIntent: AppIntent {

    static var title: LocalizedStringResource = "Talk to Dear Future Me"

    static var description = IntentDescription(
        "Opens Dear Future Me and starts listening straight away, so you can just speak."
    )

    /// Foreground the app before `perform()` resolves.
    static var openAppWhenRun: Bool = true

    /// Keep the posting on the main actor: the observers are UI-facing state.
    @MainActor
    func perform() async throws -> some IntentResult {
        NotificationCenter.default.post(name: .dfmStartListening, object: nil)
        return .result()
    }
}

/// "Write to future me" — the same listening session, opened on a letter.
///
/// Two things happen, in this order and for two different readers:
///
///   1. `UserDefaults.standard` gets `dfm_pending_intent = "letter"`. This is
///      the APP's own standard defaults, not a shared App Group suite — the
///      intent runs in-process (`openAppWhenRun = true`), so plain
///      `UserDefaults.standard` is the same store the app reads. It is the
///      channel for *what* the session should open on.
///   2. `.dfmStartListening` is posted, which is the existing channel for
///      *start a session now*.
///
/// Order matters: the observer of `.dfmStartListening` reads the key, so the
/// key has to be written first. The reading side must clear the key once
/// consumed, or every later session inherits it — see ios/WIDGET_WIRING.md,
/// which holds the exact app-side snippet.
///
/// The widget's `dearfutureme://talk?intent=letter` deep link expresses the
/// same thing over URL instead of defaults. Both funnel into one place in the
/// app; neither is a second code path.
struct WriteLetterIntent: AppIntent {

    static var title: LocalizedStringResource = "Write to Future Me"

    static var description = IntentDescription(
        "Opens Dear Future Me listening, ready to take a letter to your future self."
    )

    /// Foreground: a letter is dictated into the live session, not in the
    /// background where there is no microphone.
    static var openAppWhenRun: Bool = true

    /// The one place this string is spelled. The app side must use the same
    /// literal — it is repeated in ios/WIDGET_WIRING.md because the app target
    /// cannot import a widget-side constant and vice versa.
    static let pendingIntentDefaultsKey = "dfm_pending_intent"

    /// The value written for this intent. Matches the `intent=` query value on
    /// the widget's deep link, so the app can normalise both into one enum.
    static let pendingIntentValue = "letter"

    @MainActor
    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set(
            WriteLetterIntent.pendingIntentValue,
            forKey: WriteLetterIntent.pendingIntentDefaultsKey
        )
        NotificationCenter.default.post(name: .dfmStartListening, object: nil)
        return .result()
    }
}

/// The fallback capture path: Siri does the listening, we do the saving.
///
/// This intent deliberately does NOT open the app and does NOT touch the voice
/// pipeline or the model. Siri dictates `text`, `perform()` writes it straight
/// to the DFM API. If VoiceOS on the Mac is down, if the in-app mic session
/// misbehaves, or if the AI layer is unreachable, this still works — the whole
/// chain is Siri → our REST API. Nothing else has to be healthy.
struct QuickSaveIntent: AppIntent {

    static var title: LocalizedStringResource = "Save to Dear Future Me"

    static var description = IntentDescription(
        "Saves a thought straight to your Dear Future Me notebook using Siri dictation — no app, no AI, just kept."
    )

    /// Background on purpose: this is the path for when opening the app is the
    /// thing that isn't working.
    static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Thought",
        requestValueDialog: IntentDialog("What should future you remember?")
    )
    var text: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            return .result(dialog: "I didn't catch anything to save.")
        }
        guard !DFMConfig.dfmAPIKey.isEmpty else {
            return .result(dialog: "Open Dear Future Me once to set up your account first.")
        }

        do {
            _ = try await DFMAPI().createEntry(
                kind: "memory",
                title: nil,
                content: trimmed,
                transcript: trimmed,
                tags: ["siri"],
                context: "Captured by Siri quick-save fallback",
                revisitAt: nil
            )
            return .result(dialog: "Saved. Future you will remember.")
        } catch {
            return .result(dialog: "I couldn't reach Dear Future Me just now — it's safest to try again in a moment.")
        }
    }
}

/// Siri phrases + Spotlight + Action Button binding.
///
/// Apple's rule (verified §0.3): every phrase MUST interpolate `\(.applicationName)`.
/// A phrase without it is dropped silently at build time and Siri never learns it.
struct DFMShortcuts: AppShortcutsProvider {

    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: TalkIntent(),
            phrases: [
                "Talk to \(.applicationName)",
                "Tell \(.applicationName) something",
                "Start my reflection in \(.applicationName)"
            ],
            shortTitle: "Talk",
            systemImageName: "mic.fill"
        )
        AppShortcut(
            intent: WriteLetterIntent(),
            phrases: [
                "Write to future me in \(.applicationName)",
                "Write a letter in \(.applicationName)"
            ],
            shortTitle: "Write a letter",
            systemImageName: "envelope"
        )
        AppShortcut(
            intent: QuickSaveIntent(),
            phrases: [
                "Save a memory in \(.applicationName)",
                "Remember this in \(.applicationName)",
                "Save this to \(.applicationName)",
                "Record a memory in \(.applicationName)"
            ],
            shortTitle: "Quick save",
            systemImageName: "pencil"
        )
    }
}
