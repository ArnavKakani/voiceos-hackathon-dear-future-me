//
//  DFMConfig.swift
//  DearFutureMe
//
//  Configuration for the voice agent: where the DFM API lives and the user's
//  personal DFM key. Conversational turns always route through the local
//  VoiceOS bridge; no model-provider key is accepted on the phone.
//
//  TODO(review): Keys are stored in UserDefaults. That is DEMO-ONLY.
//  UserDefaults is plaintext inside the app container and is included in
//  device backups. Before this ships to anyone who is not us, move
//  `dfmAPIKey` into the Keychain (kSecClassGenericPassword,
//  kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly) and keep only
//  `apiBaseURL` here. This is on tomorrow's review checklist (see
//  VOICE_OS_PLAN.md D10 and Phase 7 step 5).
//
//  On first launch OnboardingView creates the DFM account and stores the key it
//  receives. Existing accounts can still paste a DFM key in SettingsView.
//  Never log the key, and never interpolate it into an error
//  message shown to the user or written to the console.
//

import Foundation

enum DFMConfig {

    // MARK: - UserDefaults keys

    private static let dfmAPIKeyDefaultsKey = "dfm_api_key"
    private static let voiceIdentifierDefaultsKey = "dfm_tts_voice_id"
    private static let voiceRateDefaultsKey = "dfm_tts_rate"
    private static let cloudVoiceDefaultsKey = "dfm_cloud_voice"

    // MARK: - Defaults

    /// Hackathon backend: the Mac-hosted gateway behind the ark404 tunnel.
    static let defaultBaseURLString = "https://dfm.ark404.xyz"

    // MARK: - Stored settings

    /// The app has one backend during the hackathon. Routes append to /v1/*.
    static let apiBaseURL = URL(string: defaultBaseURLString)!

    /// Personal DFM API key, sent as the `x-api-key` header on every DFM request.
    /// TODO(review): Keychain, not UserDefaults.
    static var dfmAPIKey: String {
        get {
            UserDefaults.standard.string(forKey: dfmAPIKeyDefaultsKey) ?? ""
        }
        set {
            UserDefaults.standard.set(
                newValue.trimmingCharacters(in: .whitespacesAndNewlines),
                forKey: dfmAPIKeyDefaultsKey
            )
        }
    }

    /// The chosen text-to-speech voice identifier (an
    /// `AVSpeechSynthesisVoice.identifier`). Empty means "auto — pick the best
    /// installed voice", which is what Speaker does when this is blank.
    static var ttsVoiceIdentifier: String {
        get { UserDefaults.standard.string(forKey: voiceIdentifierDefaultsKey) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: voiceIdentifierDefaultsKey) }
    }

    /// Speaking rate as a fraction of the system default (1.0 = default).
    /// Clamped to a sensible range; 0 (unset) resolves to 0.96.
    static var ttsRate: Double {
        get {
            let stored = UserDefaults.standard.double(forKey: voiceRateDefaultsKey)
            return stored == 0 ? 0.96 : min(max(stored, 0.5), 1.5)
        }
        set { UserDefaults.standard.set(min(max(newValue, 0.5), 1.5), forKey: voiceRateDefaultsKey) }
    }

    /// Use the natural cloud voice (ElevenLabs via the gateway's /v1/tts) for
    /// spoken replies. On by default. When unavailable, replies are text-only;
    /// the app never falls back to a device or accessibility voice.
    static var cloudVoiceEnabled: Bool {
        get {
            UserDefaults.standard.register(defaults: [cloudVoiceDefaultsKey: true])
            return UserDefaults.standard.bool(forKey: cloudVoiceDefaultsKey)
        }
        set { UserDefaults.standard.set(newValue, forKey: cloudVoiceDefaultsKey) }
    }

    // MARK: - Derived

    /// A DFM account key is the only user-facing requirement.
    static var isConfigured: Bool {
        !dfmAPIKey.isEmpty
    }
}
