//
//  SessionController.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  The conversation state machine. This is the ONLY place that knows how a turn
//  flows; views just read `state` and call `handleOrbTap()`.
//
//  Pipeline (FUTURE_PLAN.md §24, restated in VOICE_OS_PLAN.md):
//
//      speech in → transcript → agent → tools → reply → speech out → speech in …
//
//  ANTI-PATTERN GUARD (§0.4 #8): there is no tool-selection or agent logic in
//  any SwiftUI view. Views own zero conversation state. All of it lives here,
//  and everything model-facing lives behind `AgentLoop`.
//
//  DEPENDENCY CONTRACT — `AgentLoop.swift` is written by another agent and must
//  expose exactly:
//
//      actor AgentLoop {
//          init()
//          func respond(to userText: String) async throws -> String
//          func reset()
//      }
//

import Foundation
import Observation

// MARK: - State

/// Where the conversation is right now.
///
/// Declared at file scope (not nested) so views can write `SessionState.listening`
/// without qualifying it through the controller.
enum SessionState {
    case idle
    case listening
    case thinking
    case speaking
}

// MARK: - SessionController

/// Owns the microphone, the synthesizer and the agent, and drives the turn loop.
@Observable
@MainActor
final class SessionController {

    // MARK: Spoken copy
    //
    // Kept as constants so the wording is reviewable in one place rather than
    // scattered through error paths.

    /// Spoken when anything at all goes wrong. Short on purpose: a long apology
    /// out loud feels much worse than a brief one.
    static let apologyLine = "Hmm, I couldn't do that just now."

    /// Spoken when the agent returns an empty reply.
    static let emptyReplyLine = "I'm here. Tell me more."

    /// Spoken when permissions are missing.
    static let permissionLine =
        "I need microphone and speech permission before we can talk. You can turn them on in Settings."

    // MARK: Observable state

    /// The current phase of the conversation. Drives the entire UI.
    /// Written only by this type — treat it as read-only from the outside.
    var state: SessionState = .idle

    /// Running transcript of the conversation for the UI.
    /// Roles are `"user"` and `"assistant"`.
    var messages: [(role: String, text: String)] = []

    /// Last thing that went wrong, for a quiet on-screen note. Never fatal.
    var lastError: String?

    // MARK: Collaborators

    /// Live speech-to-text. Exposed so the view can render `speech.transcript`.
    let speech = SpeechRecognizer()

    /// Text-to-speech. Exposed so the view can react to `speaker.isSpeaking`.
    let speaker = Speaker()

    /// The agent. An actor, so nothing about model calls or tool selection can
    /// leak onto the main thread or into a view.
    @ObservationIgnored
    private let agent = AgentLoop()

    /// On-device history of past conversations. Injected so a test can hand in
    /// a store pointed at a scratch file.
    @ObservationIgnored
    private let chatStore: ChatStore

    // MARK: Private state

    /// True between `startSession()` and `endSession()`. Distinct from `state`:
    /// it answers "should we hand the turn back to the microphone when the
    /// current utterance finishes?"
    @ObservationIgnored
    private var sessionActive: Bool = false

    /// The in-flight `agent.respond(to:)` call, so a session end can cancel it.
    @ObservationIgnored
    private var respondTask: Task<Void, Never>?

    /// Microphone barge-in: keep the recognizer running *while* the agent
    /// speaks, so talking over it interrupts.
    ///
    /// DEFAULT OFF, deliberately. Without acoustic echo cancellation the
    /// microphone hears the synthesizer and transcribes the app's own voice
    /// back into the conversation — a feedback loop that would destroy the
    /// demo. Tap-to-interrupt (see `handleOrbTap()`) covers the same need and
    /// always works. Flip this to `true` only after testing on a device with
    /// AirPods or after enabling voice processing on the input node.
    @ObservationIgnored
    private let micBargeInEnabled: Bool = false

    // MARK: Transcript bookkeeping (for ChatStore)
    //
    // `messages` stays a plain `[(role, text)]` tuple array: three files read it
    // and widening the tuple would ripple through all of them for no gain. The
    // timestamps live here instead, appended in lockstep by `appendMessage`, so
    // a stored `ChatLine.at` is the real moment the line happened rather than a
    // value back-filled from the session end.

    /// Wall-clock time of `messages[i]`, same order, same count.
    @ObservationIgnored
    private var messageTimes: [Date] = []

    /// How many entries of `messages` have already been written to the store.
    /// Everything past this index is the conversation still in progress.
    @ObservationIgnored
    private var persistedMessageCount: Int = 0

    /// When the current (unsaved) stretch of conversation began.
    @ObservationIgnored
    private var sessionStartedAt: Date?

    // MARK: - Lifecycle

    /// - Parameter chatStore: where finished conversations are saved. Defaults
    ///   to the shared on-device store; pass one in from a test.
    init(chatStore: ChatStore? = nil) {
        self.chatStore = chatStore ?? ChatStore.shared

        // Both collaborators already call back on the main thread. The closures
        // are marked `@Sendable` (so they carry no actor isolation of their own)
        // and hop through a main-actor `Task`, which makes the isolation
        // explicit to the compiler instead of assumed. This is what keeps the
        // file clean under strict concurrency checking.
        speech.onFinalUtterance = { @Sendable [weak self] text in
            Task { @MainActor in
                self?.handleFinalUtterance(text)
            }
        }

        speaker.onFinished = { @Sendable [weak self] in
            Task { @MainActor in
                self?.handleSpeechFinished()
            }
        }
    }

    // MARK: - Derived state (for the UI)

    /// True whenever a conversation is running.
    var isActive: Bool {
        state != .idle
    }

    /// The most recent thing the user said, or "".
    var lastUserText: String {
        for message in messages.reversed() where message.role == "user" {
            return message.text
        }
        return ""
    }

    /// The most recent thing the agent said, or "".
    var lastAssistantText: String {
        for message in messages.reversed() where message.role == "assistant" {
            return message.text
        }
        return ""
    }

    // MARK: - Public API

    /// Starts a conversation: asks for permissions if needed, then listens.
    /// Safe to call when a session is already running (does nothing).
    ///
    /// - Parameter intent: what the entry point was reaching for (widget CTA or
    ///   Siri shortcut). When set, the session opens by speaking
    ///   `intent.openingLine` instead of waiting in silence, and the agent is
    ///   seeded so it does not greet a second time.
    func startSession(intent: DFMEntryIntent? = nil) {
        // `sessionActive` is checked as well as `state`: between the tap and the
        // permission callback the state is still `.idle`, and a second tap in
        // that window must not spawn a second conversation.
        guard state == .idle, !sessionActive else { return }

        lastError = nil
        sessionActive = true

        // Only stamp a start time when this is genuinely a fresh stretch of
        // conversation. Tapping the orb to resume after an accidental end keeps
        // the original start, so the two halves save as one chat.
        if sessionStartedAt == nil {
            sessionStartedAt = Date()
        }

        Task { @MainActor in
            // Seed before the first turn, not after: the agent must already
            // know the topic when the user's first sentence arrives.
            await self.agent.setEntrySeed(intent?.seedContext)

            let granted = await self.speech.requestPermissions()
            guard self.sessionActive else { return }

            guard granted else {
                self.lastError = "Microphone and speech access are needed to talk."
                self.sessionActive = false
                self.speakLine(SessionController.permissionLine, recordAsAssistant: false)
                return
            }

            if let intent {
                // Speaking sets `state = .speaking`; the normal speech-finished
                // hand-back starts listening, exactly as after any agent reply.
                // Do NOT also call `beginListening()` here — that would cut the
                // line off mid-word.
                self.speakLine(intent.openingLine, recordAsAssistant: true)
            } else {
                self.beginListening()
            }
        }
    }

    /// Ends the conversation and releases the audio session.
    /// Keeps `messages` and the agent's memory, so an accidental tap mid-demo
    /// is recoverable — use `resetConversation()` for a clean slate.
    func endSession() {
        sessionActive = false

        // Keep the conversation before tearing anything down. Idempotent, so
        // the double end (orb tap, then backgrounding) saves once.
        persistTranscriptIfNeeded()

        respondTask?.cancel()
        respondTask = nil

        // Set state first: the callbacks that `stop`/`stopSpeaking` trigger all
        // guard on `state`, so this makes them no-ops.
        state = .idle

        speech.stop()
        speaker.stopSpeaking()

        // The ONE place the audio session is torn down. Never between turns.
        DFMAudioSession.deactivate()
    }

    /// Clears the visible transcript and the agent's conversation memory.
    ///
    /// Anything already written to `ChatStore` stays written — this clears the
    /// screen, not your history.
    func resetConversation() {
        persistTranscriptIfNeeded()

        messages.removeAll()
        messageTimes.removeAll()
        persistedMessageCount = 0
        sessionStartedAt = nil

        lastError = nil
        Task { @MainActor in
            await self.agent.setEntrySeed(nil)
            await self.agent.reset()
        }
    }

    /// Single tap target for the orb.
    ///
    /// - idle → start talking
    /// - speaking → interrupt and listen (the barge-in gesture)
    /// - listening / thinking → end the session
    func handleOrbTap() {
        switch state {
        case .idle:
            startSession()
        case .speaking:
            interrupt()
        case .listening, .thinking:
            endSession()
        }
    }

    /// Cuts the agent off mid-sentence and hands the turn back to the user.
    func interrupt() {
        guard state == .speaking else { return }
        speaker.stopSpeaking()
        beginListening()
    }

    // MARK: - Private: the turn loop

    private func beginListening() {
        guard sessionActive else {
            state = .idle
            return
        }

        do {
            try speech.start()
            state = .listening
        } catch {
            lastError = error.localizedDescription
            sessionActive = false
            speakLine(SessionController.apologyLine, recordAsAssistant: false)
        }
    }

    /// The user finished an utterance. Send it to the agent.
    private func handleFinalUtterance(_ text: String) {
        guard sessionActive else { return }

        // Barge-in path: an utterance arriving while we speak means the user
        // talked over us.
        if state == .speaking {
            speaker.stopSpeaking()
        }

        guard state == .listening || state == .speaking else { return }

        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            beginListening()
            return
        }

        appendMessage(role: "user", text: trimmed)
        state = .thinking

        respondTask?.cancel()
        respondTask = Task { @MainActor in
            do {
                let reply = try await self.agent.respond(to: trimmed)
                guard !Task.isCancelled, self.sessionActive else { return }

                let cleaned = reply.trimmingCharacters(in: .whitespacesAndNewlines)
                let line = cleaned.isEmpty ? SessionController.emptyReplyLine : cleaned
                self.speakLine(line, recordAsAssistant: true)
            } catch is CancellationError {
                return
            } catch {
                guard self.sessionActive else { return }
                self.lastError = error.localizedDescription
                // Never die silently: say something, then keep listening.
                self.speakLine(SessionController.apologyLine, recordAsAssistant: true)
            }
        }
    }

    /// The synthesizer finished (or was cancelled). Hand the turn back.
    private func handleSpeechFinished() {
        guard state == .speaking else { return }

        if sessionActive {
            beginListening()
        } else {
            state = .idle
        }
    }

    /// Speaks a line and moves to `.speaking`.
    ///
    /// - Parameter recordAsAssistant: whether the line belongs in the visible
    ///   transcript. Permission prompts and start-up failures do not.
    private func speakLine(_ text: String, recordAsAssistant: Bool) {
        // Belt and braces: the recognizer should already be stopped, but a live
        // microphone during playback is exactly the feedback loop we avoid.
        if !micBargeInEnabled {
            speech.stop()
        }

        if recordAsAssistant {
            appendMessage(role: "assistant", text: text)
        }

        state = .speaking
        speaker.speak(text)
    }

    // MARK: - Private: transcript persistence

    /// Appends to the visible transcript and records when it happened.
    /// The only place `messages` grows, so the two arrays cannot drift apart.
    private func appendMessage(role: String, text: String) {
        messages.append((role: role, text: text))
        messageTimes.append(Date())
    }

    /// Writes everything said since the last save to `ChatStore`, if any of it
    /// came from the user.
    ///
    /// Silence is not history: a session where you tapped the orb, heard the
    /// permission line and left has no user line in it and is not worth keeping.
    private func persistTranscriptIfNeeded() {
        let start = min(persistedMessageCount, messages.count)
        guard start < messages.count else { return }

        let pending = Array(messages[start...])
        guard pending.contains(where: { $0.role == "user" }) else { return }

        let endedAt = Date()
        var lines: [ChatLine] = []
        lines.reserveCapacity(pending.count)

        for offset in 0..<pending.count {
            let index = start + offset
            let at = index < messageTimes.count ? messageTimes[index] : endedAt
            lines.append(
                ChatLine(role: pending[offset].role, text: pending[offset].text, at: at)
            )
        }

        let startedAt = sessionStartedAt ?? lines.first?.at ?? endedAt
        chatStore.save(
            ChatSession(startedAt: startedAt, endedAt: endedAt, messages: lines)
        )

        persistedMessageCount = messages.count
        sessionStartedAt = nil
    }
}
