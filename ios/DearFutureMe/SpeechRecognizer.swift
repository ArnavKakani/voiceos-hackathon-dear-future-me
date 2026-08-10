//
//  SpeechRecognizer.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  Live, on-device speech-to-text using the canonical SFSpeechRecognizer
//  pattern (VOICE_OS_PLAN.md §0.3):
//
//      SFSpeechAudioBufferRecognitionRequest
//        + shouldReportPartialResults = true
//        + requiresOnDeviceRecognition when supported
//        + AVAudioEngine inputNode tap, 1024 frames, inputNode.outputFormat(forBus: 0)
//
//  End-of-utterance is a 1.2 s silence timer that restarts on every partial
//  result — deliberately simple, and good enough for a conversational demo.
//
//  Info.plist keys required (Xcode step, tomorrow):
//      NSMicrophoneUsageDescription
//      NSSpeechRecognitionUsageDescription
//
//  THREADING CONTRACT
//    - `start()` / `stop()` are expected to be called from the main thread
//      (SessionController is @MainActor). The class itself is intentionally NOT
//      actor-isolated so the audio tap can run without hopping actors.
//    - The audio tap does ONE thing: `request.append(buffer)`. No main-thread
//      work, no observable mutation (anti-pattern: blocking the audio thread).
//    - Every mutation of `transcript` / `isListening` and every callback is
//      dispatched to the main queue, so SwiftUI observation is always safe.
//

import Foundation
import AVFoundation
import Speech
import Observation

// MARK: - Shared audio session

/// The one place in the app that configures `AVAudioSession`.
///
/// THE classic bug this exists to prevent (VOICE_OS_PLAN.md §0.4 / Phase 6):
/// after recording, TTS goes silent. It happens when two components each own
/// the session and one deactivates it between the record phase and the speak
/// phase. So:
///
///   * `activateForConversation()` is idempotent and is called before recording
///     AND before speaking.
///   * `deactivate()` is called in exactly one place — `SessionController.endSession()`
///     — never between a listen turn and a speak turn.
///   * The category stays `.playAndRecord` for the whole conversation, with
///     `.defaultToSpeaker` so TTS comes out of the loud speaker rather than the
///     earpiece.
enum DFMAudioSession {

    /// Configures and activates the session for a full duplex voice conversation.
    /// Safe to call repeatedly.
    static func activateForConversation() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .spokenAudio,
            options: [.defaultToSpeaker, .duckOthers]
        )
        try session.setActive(true, options: [])
    }

    /// Releases the session. Call this ONLY when the whole conversation ends.
    static func deactivate() {
        let session = AVAudioSession.sharedInstance()
        try? session.setActive(false, options: [.notifyOthersOnDeactivation])
    }
}

// MARK: - Errors

/// Failures that `SpeechRecognizer.start()` can throw.
enum SpeechRecognizerError: LocalizedError {
    case notAuthorized
    case recognizerUnavailable
    case audioInputUnavailable

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Microphone and speech recognition permission are required."
        case .recognizerUnavailable:
            return "Speech recognition is not available right now."
        case .audioInputUnavailable:
            return "The microphone input is not available right now."
        }
    }
}

// MARK: - SpeechRecognizer

/// Live speech-to-text with a silence-based end-of-utterance detector.
///
/// Contract (other agents compile against this):
///   - `var transcript: String`                    live partial text
///   - `var isListening: Bool`
///   - `var onFinalUtterance: ((String) -> Void)?` fires once, on the main
///                                                 thread, 1.2 s after the last
///                                                 partial; listening stops first
///   - `func requestPermissions() async -> Bool`
///   - `func start() throws`
///   - `func stop()`
@Observable
final class SpeechRecognizer {

    // MARK: Observable state

    /// The best transcription so far for the utterance in progress.
    /// Cleared at the start of every listening turn.
    var transcript: String = ""

    /// True while the microphone tap is installed and a recognition task is running.
    var isListening: Bool = false

    // MARK: Callbacks

    /// Called on the main thread exactly once per utterance, after 1.8 s of
    /// silence, with the trimmed final text. Listening has already stopped by
    /// the time this fires. Never called with empty text.
    @ObservationIgnored
    var onFinalUtterance: ((String) -> Void)?

    // MARK: Tuning

    /// Silence required before we consider the user finished talking.
    @ObservationIgnored
    private let silenceThreshold: TimeInterval = 1.8

    /// Guards against an infinite restart loop if the microphone is wedged.
    @ObservationIgnored
    private let maxConsecutiveEmptyRestarts: Int = 3

    // MARK: Private state (main thread only)

    @ObservationIgnored
    private let recognizer: SFSpeechRecognizer? = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

    @ObservationIgnored
    private var audioEngine: AVAudioEngine?

    @ObservationIgnored
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?

    @ObservationIgnored
    private var recognitionTask: SFSpeechRecognitionTask?

    /// Restartable "user stopped talking" timer. A `DispatchWorkItem` rather
    /// than a `Task` so there is zero concurrency-checking surface here.
    @ObservationIgnored
    private var silenceWork: DispatchWorkItem?

    /// Incremented when a recognition task ends with nothing transcribed; reset
    /// as soon as any partial arrives.
    @ObservationIgnored
    private var consecutiveEmptyRestarts: Int = 0

    #if targetEnvironment(simulator)
    @ObservationIgnored private var simulatorAudioFile: AVAudioFile?
    @ObservationIgnored private var simulatorAudioURL: URL?
    @ObservationIgnored private var simulatorSilenceWork: DispatchWorkItem?
    @ObservationIgnored private var simulatorMaximumWork: DispatchWorkItem?
    @ObservationIgnored private var simulatorRestartWork: DispatchWorkItem?
    @ObservationIgnored private var simulatorDetectedSpeech = false
    @ObservationIgnored private var simulatorLastVoiceSignal: TimeInterval = 0
    @ObservationIgnored private var simulatorTranscriptionTask: Task<Void, Never>?
    #endif

    // MARK: - Permissions

    /// Requests speech recognition and microphone permission.
    /// - Returns: `true` only when BOTH were granted.
    func requestPermissions() async -> Bool {
        let speechGranted: Bool = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
        guard speechGranted else { return false }

        // iOS 17+ replacement for AVAudioSession.requestRecordPermission.
        let micGranted: Bool = await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
        return micGranted
    }

    // MARK: - Start / stop

    /// Begins a listening turn. Idempotent: a second call while already
    /// listening does nothing.
    func start() throws {
        if isListening { return }

        guard SFSpeechRecognizer.authorizationStatus() == .authorized else {
            throw SpeechRecognizerError.notAuthorized
        }
        #if !targetEnvironment(simulator)
        guard let recognizer = recognizer, recognizer.isAvailable else {
            throw SpeechRecognizerError.recognizerUnavailable
        }
        #endif

        // Activate the session BEFORE touching the input node: an inactive
        // session reports a 0 Hz input format and installTap then traps.
        try DFMAudioSession.activateForConversation()

        // A fresh engine every turn. Reusing one across category changes is the
        // usual source of "required condition is false: format.sampleRate" crashes.
        let engine = AVAudioEngine()
        let inputNode = engine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        guard recordingFormat.sampleRate > 0, recordingFormat.channelCount > 0 else {
            throw SpeechRecognizerError.audioInputUnavailable
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        request.taskHint = .dictation
        request.addsPunctuation = true
        #if !targetEnvironment(simulator)
        if recognizer.supportsOnDeviceRecognition {
            // Real iPhones keep the private, low-latency on-device path.
            request.requiresOnDeviceRecognition = true
        }
        #endif

        #if targetEnvironment(simulator)
        let audioURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("dfm-utterance-\(UUID().uuidString)")
            .appendingPathExtension("caf")
        let audioFile = try AVAudioFile(
            forWriting: audioURL,
            settings: recordingFormat.settings
        )
        simulatorAudioFile = audioFile
        simulatorAudioURL = audioURL
        simulatorDetectedSpeech = false
        simulatorLastVoiceSignal = 0
        #endif

        // Removing first makes start() safe even if a previous turn tore down badly.
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            #if !targetEnvironment(simulator)
            request.append(buffer)
            #else
            try? audioFile.write(from: buffer)
            guard SpeechRecognizer.bufferContainsVoice(buffer) else { return }

            let now = ProcessInfo.processInfo.systemUptime
            guard now - (self?.simulatorLastVoiceSignal ?? 0) > 0.08 else { return }
            self?.simulatorLastVoiceSignal = now
            DispatchQueue.main.async { [weak self] in
                self?.handleSimulatorVoiceActivity()
            }
            #endif
        }

        engine.prepare()
        try engine.start()

        audioEngine = engine
        recognitionRequest = request
        transcript = ""
        isListening = true

        #if targetEnvironment(simulator)
        // Apple speech currently fails with kAFAssistantErrorDomain 1101 in
        // Simulator. The recording below uses the gateway instead.
        scheduleSimulatorMaximumCapture()
        #else
        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let text = result.bestTranscription.formattedString
                let isFinal = result.isFinal
                DispatchQueue.main.async {
                    self.handlePartial(text: text, isFinal: isFinal)
                }
            }

            if error != nil {
                DispatchQueue.main.async {
                    self.handleTaskEnded()
                }
            }
        }
        #endif

        // Note: the silence timer is intentionally NOT armed here. It starts on
        // the first partial result, so a user who takes a few seconds to gather
        // their thoughts is never cut off.
    }

    /// Stops listening and tears everything down. Idempotent and safe to call
    /// from any of the callback paths.
    func stop() {
        // First, so any re-entrant call from a cancelled task's handler no-ops.
        isListening = false

        silenceWork?.cancel()
        silenceWork = nil

        #if targetEnvironment(simulator)
        simulatorSilenceWork?.cancel()
        simulatorSilenceWork = nil
        simulatorMaximumWork?.cancel()
        simulatorMaximumWork = nil
        simulatorRestartWork?.cancel()
        simulatorRestartWork = nil
        simulatorTranscriptionTask?.cancel()
        simulatorTranscriptionTask = nil
        #endif

        if let engine = audioEngine {
            engine.inputNode.removeTap(onBus: 0)
            if engine.isRunning {
                engine.stop()
            }
        }
        audioEngine = nil

        recognitionRequest?.endAudio()
        recognitionRequest = nil

        recognitionTask?.cancel()
        recognitionTask = nil

        #if targetEnvironment(simulator)
        simulatorAudioFile = nil
        if let url = simulatorAudioURL {
            try? FileManager.default.removeItem(at: url)
        }
        simulatorAudioURL = nil
        simulatorDetectedSpeech = false
        #endif
    }

    // MARK: - Private: recognition callbacks (main thread)

    private func handlePartial(text: String, isFinal: Bool) {
        guard isListening else { return }

        transcript = text
        if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            consecutiveEmptyRestarts = 0
        }

        if isFinal {
            finishUtterance()
        } else {
            scheduleSilenceCheck()
        }
    }

    /// The recognition task ended on its own (error, or the ~1 minute per-task
    /// limit). If we have text, treat it as the end of the utterance. If we do
    /// not, quietly restart so the microphone does not go deaf mid-conversation.
    private func handleTaskEnded() {
        guard isListening else { return }

        let text = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.isEmpty {
            restartAfterEmptyTask()
        } else {
            finishUtterance()
        }
    }

    private func restartAfterEmptyTask() {
        stop()

        #if targetEnvironment(simulator)
        consecutiveEmptyRestarts += 1
        scheduleSimulatorRestart()
        #else
        guard consecutiveEmptyRestarts < maxConsecutiveEmptyRestarts else {
            consecutiveEmptyRestarts = 0
            return
        }
        consecutiveEmptyRestarts += 1

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
            guard let self = self else { return }
            guard !self.isListening else { return }
            try? self.start()
        }
        #endif
    }

    /// (Re)arms the 1.8 s end-of-utterance timer. The slightly patient pause is
    /// deliberate: clarification is useful only after the person finishes.
    private func scheduleSilenceCheck() {
        silenceWork?.cancel()

        let work = DispatchWorkItem { [weak self] in
            self?.finishUtterance()
        }
        silenceWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + silenceThreshold, execute: work)
    }

    /// Ends the turn: stop listening, then hand the final text up exactly once.
    private func finishUtterance() {
        guard isListening else { return }

        let text = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        consecutiveEmptyRestarts = 0
        stop()

        guard !text.isEmpty else { return }
        onFinalUtterance?(text)
    }

    #if targetEnvironment(simulator)
    // MARK: - Simulator speech fallback

    private static func bufferContainsVoice(_ buffer: AVAudioPCMBuffer) -> Bool {
        guard let samples = buffer.floatChannelData?[0] else { return false }
        let count = Int(buffer.frameLength)
        guard count > 0 else { return false }

        var sum: Float = 0
        var peak: Float = 0
        for index in 0..<count {
            let value = abs(samples[index])
            peak = max(peak, value)
            sum += value * value
        }
        let rms = sqrt(sum / Float(count))

        // Simulator's host bridge carries a steady noise floor. Require a
        // clear voice-sized jump; the maximum window remains the safety net.
        return rms > 0.008 && peak > 0.04
    }

    private func handleSimulatorVoiceActivity() {
        guard isListening else { return }
        simulatorDetectedSpeech = true
        simulatorSilenceWork?.cancel()

        let work = DispatchWorkItem { [weak self] in
            self?.finishSimulatorRecording()
        }
        simulatorSilenceWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.15, execute: work)
    }

    private func scheduleSimulatorMaximumCapture() {
        simulatorMaximumWork?.cancel()
        let work = DispatchWorkItem { [weak self] in
            self?.finishSimulatorRecording(force: true)
        }
        simulatorMaximumWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 8, execute: work)
    }

    /// AVAudioEngine can remain busy for a beat after a Simulator capture is
    /// torn down. Retry until its microphone tap is genuinely live again.
    private func scheduleSimulatorRestart() {
        simulatorRestartWork?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self, !self.isListening else { return }
            do {
                try self.start()
            } catch {
                self.stop()
                self.scheduleSimulatorRestart()
            }
        }
        simulatorRestartWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.75, execute: work)
    }

    private func finishSimulatorRecording(force: Bool = false) {
        guard isListening,
              (simulatorDetectedSpeech || force),
              let url = simulatorAudioURL else {
            return
        }

        // Take ownership before stop(), which otherwise removes an abandoned
        // recording. Removing the input tap flushes AVAudioFile.
        simulatorAudioURL = nil
        stop()

        // Detached so the upload never inherits cancellation from the UI
        // callback that ended this capture window.
        simulatorTranscriptionTask = Task.detached(priority: .userInitiated) { [weak self] in
            defer { try? FileManager.default.removeItem(at: url) }

            do {
                let text = try await SpeechRecognizer.transcribeRecordedAudio(at: url)
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                try Task.checkCancellation()
                await self?.completeSimulatorTranscription(text)
            } catch is CancellationError {
                return
            } catch {
                await self?.failSimulatorTranscription()
            }
        }
    }

    @MainActor
    private func completeSimulatorTranscription(_ text: String) {
        simulatorTranscriptionTask = nil
        transcript = text
        if text.isEmpty {
            restartAfterEmptyTask()
        } else {
            consecutiveEmptyRestarts = 0
            onFinalUtterance?(text)
        }
    }

    @MainActor
    private func failSimulatorTranscription() {
        simulatorTranscriptionTask = nil
        restartAfterEmptyTask()
    }

    private static func transcribeRecordedAudio(at url: URL) async throws -> String {
        let audio = try Data(contentsOf: url)
        guard !DFMConfig.dfmAPIKey.isEmpty else {
            throw SpeechRecognizerError.notAuthorized
        }

        var request = URLRequest(
            url: DFMConfig.apiBaseURL
                .appendingPathComponent("v1")
                .appendingPathComponent("stt")
        )
        request.httpMethod = "POST"
        request.timeoutInterval = 60
        request.setValue(DFMConfig.dfmAPIKey, forHTTPHeaderField: "x-api-key")
        request.setValue("audio/x-caf", forHTTPHeaderField: "content-type")
        request.httpBody = audio

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode < 300 else {
            throw SpeechRecognizerError.recognizerUnavailable
        }
        let body = try JSONDecoder().decode(SimulatorTranscriptResponse.self, from: data)
        return body.text
    }

    private struct SimulatorTranscriptResponse: Decodable {
        let text: String
    }
    #endif
}
