//
//  Speaker.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  ElevenLabs-only text-to-speech for the agent's replies.
//
//  The audio session is owned by `DFMAudioSession` (see SpeechRecognizer.swift).
//  This type only ever *activates* it — it never deactivates it — because
//  deactivating the session between the record turn and the speak turn is THE
//  classic "TTS is silent after recording" bug (VOICE_OS_PLAN.md Phase 6
//  anti-patterns).
//
//  There is deliberately no AVSpeechSynthesizer fallback in this type. If the
//  cloud voice cannot be fetched or played, the response remains text-only.
//

import Foundation
import AVFoundation
import Observation

/// Delegate shim for AVAudioPlayer (a class-bound Obj-C delegate can't be the
/// @Observable Speaker directly without friction). Forwards completion.
private final class AudioPlayerDelegate: NSObject, AVAudioPlayerDelegate {
    var onDone: ((Bool) -> Void)?
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        onDone?(flag)
    }
    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        onDone?(false)
    }
}

/// Speaks the agent's replies aloud.
///
/// Contract (other agents compile against this):
///   - `var isSpeaking: Bool`
///   - `var onFinished: (() -> Void)?`   fires on the main thread for BOTH
///                                       natural completion and cancellation
///   - `func speak(_ text: String)`
///   - `func stopSpeaking()`
@Observable
final class Speaker: NSObject {

    // MARK: Observable state

    /// True between `speak(_:)` and the delegate's finish/cancel callback.
    var isSpeaking: Bool = false

    // MARK: Callbacks

    /// Called on the main thread when an utterance finishes OR is cancelled.
    /// The session controller uses this to hand the turn back to the microphone.
    @ObservationIgnored
    var onFinished: (() -> Void)?

    // MARK: Private state

    /// Cloud (ElevenLabs) playback path. Nil unless a cloud reply is playing.
    @ObservationIgnored
    private var audioPlayer: AVAudioPlayer?
    @ObservationIgnored
    private let audioDelegate = AudioPlayerDelegate()
    /// Bumped each `speak`; a late cloud fetch for a superseded turn is dropped.
    @ObservationIgnored
    private var speakGeneration = 0

    // MARK: - Public API

    /// Speaks `text`. Empty or whitespace-only input completes immediately so
    /// the conversation loop never stalls waiting for a callback.
    func speak(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmed.isEmpty else {
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.isSpeaking = false
                self.onFinished?()
            }
            return
        }

        // Idempotent; makes sure output is routed to the speaker even if the
        // route changed (headphones unplugged, call ended, …).
        try? DFMAudioSession.activateForConversation()

        audioPlayer?.stop()
        audioPlayer = nil

        speakGeneration += 1
        let generation = speakGeneration
        isSpeaking = true

        // Cloud voice ONLY (ElevenLabs via the gateway). The on-device
        // synthesizer must never make a sound. If the cloud call fails, the
        // turn completes silently so the conversation loop keeps going — it
        // just doesn't speak that reply aloud.
        Task { [weak self] in
            guard let self = self else { return }
            if let data = await Speaker.fetchCloudAudio(trimmed) {
                await MainActor.run {
                    guard generation == self.speakGeneration else { return }
                    self.playCloud(data)
                }
            } else {
                await MainActor.run {
                    guard generation == self.speakGeneration else { return }
                    self.deliverFinished()  // silent; no device voice
                }
            }
        }
    }

    /// Stops ElevenLabs playback immediately (barge-in / tap-to-interrupt).
    func stopSpeaking() {
        speakGeneration += 1  // orphan any in-flight cloud fetch
        if audioPlayer?.isPlaying == true {
            audioPlayer?.stop()
            audioPlayer = nil
            deliverFinished()
            return
        }
        audioPlayer = nil
        isSpeaking = false
    }

    // MARK: - Cloud (ElevenLabs via the gateway)

    /// POST the reply text to the gateway's /v1/tts and get back mp3 bytes.
    /// Returns nil on any failure; the caller completes silently/text-only.
    private static func fetchCloudAudio(_ text: String) async -> Data? {
        guard !DFMConfig.dfmAPIKey.isEmpty else { return nil }
        var request = URLRequest(
            url: DFMConfig.apiBaseURL
                .appendingPathComponent("v1")
                .appendingPathComponent("tts")
        )
        request.httpMethod = "POST"
        request.timeoutInterval = 25
        request.setValue(DFMConfig.dfmAPIKey, forHTTPHeaderField: "x-api-key")
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["text": text])
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode < 300,
                  !data.isEmpty else { return nil }
            return data
        } catch {
            return nil
        }
    }

    private func playCloud(_ data: Data) {
        do {
            try DFMAudioSession.activateForConversation()
            let player = try AVAudioPlayer(data: data)
            audioDelegate.onDone = { [weak self] _ in
                DispatchQueue.main.async {
                    self?.audioPlayer = nil
                    self?.deliverFinished()
                }
            }
            player.delegate = audioDelegate
            audioPlayer = player
            isSpeaking = true
            player.play()
        } catch {
            // Decoding/playback failed: complete silently. Never invoke a
            // device, Siri, accessibility, or browser voice.
            deliverFinished()
        }
    }

    // MARK: - Private

    private func deliverFinished() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            self.isSpeaking = false
            self.onFinished?()
        }
    }
}
