//
//  SettingsView.swift
//  DearFutureMe
//
//  Hackathon connection settings and voice preview. The app is locked to the
//  Cloudflare gateway and receives its demo key during account setup.
//
//  Styling follows DFMTheme (Theme.swift) — cream paper, green ink, no white
//  surfaces and no gray text (DESIGN_SYSTEM.md §17).
//
//  TODO(review): keys are written to UserDefaults via DFMConfig. Keychain
//  before this ships.
//

import SwiftUI
import AVFoundation

struct SettingsView: View {

    @Environment(\.dismiss) private var dismiss

    @State private var isTesting = false
    @State private var testMessage: String?
    @State private var testSucceeded = false

    // Plays the ElevenLabs preview sample.
    @State private var previewSpeaker = Speaker()

    var body: some View {
        ZStack {
            DFMTheme.cream.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    header
                    connectionSection
                    voiceSection
                    testSection
                    footer
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 32)
            }
        }
        .tint(DFMTheme.leafGreen)
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Settings")
                .font(DFMTheme.title(30))
                .foregroundStyle(DFMTheme.inkGreen)

            Text("just the setup bits")
                .font(DFMTheme.hand(22))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.75))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var connectionSection: some View {
        card {
            VStack(alignment: .leading, spacing: 18) {
                Text("Connection")
                    .font(DFMTheme.title(20))
                    .foregroundStyle(DFMTheme.inkGreen)

                Label("Connected automatically", systemImage: "checkmark.circle.fill")
                    .font(DFMTheme.title(16))
                    .foregroundStyle(DFMTheme.leafGreen)
                Text("The app uses the DFM Cloudflare tunnel and its preconfigured demo account. No API key or server address needs to be pasted here.")
                    .font(DFMTheme.hand(18))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.75))
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var voiceSection: some View {
        card {
            VStack(alignment: .leading, spacing: 16) {
                Text("Voice")
                    .font(DFMTheme.title(20))
                    .foregroundStyle(DFMTheme.inkGreen)

                Text("Future you speaks with a natural cloud voice.")
                    .font(DFMTheme.hand(18))
                    .foregroundStyle(DFMTheme.leafGreen.opacity(0.8))

                Button {
                    previewSpeaker.speak("Hey, it's future you. This is how I'll sound.")
                } label: {
                    Text("Preview voice")
                        .font(DFMTheme.title(16))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .foregroundStyle(DFMTheme.inkGreen)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(DFMTheme.leafGreen, lineWidth: 2)
                        )
                }
            }
        }
    }

    private var testSection: some View {
        card {
            VStack(alignment: .leading, spacing: 14) {
                Button {
                    runConnectionTest()
                } label: {
                    HStack(spacing: 10) {
                        if isTesting {
                            ProgressView()
                                .tint(DFMTheme.cream)
                        }
                        Text(isTesting ? "Checking…" : "Test connection")
                            .font(DFMTheme.title(17))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(DFMTheme.leafGreen)
                    .foregroundStyle(DFMTheme.cream)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
                .disabled(isTesting)

                if let testMessage = testMessage {
                    Text(testMessage)
                        .font(DFMTheme.hand(19))
                        .foregroundStyle(
                            testSucceeded
                                ? DFMTheme.leafGreen
                                : DFMTheme.inkGreen.opacity(0.85)
                        )
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Button {
                    dismiss()
                } label: {
                    Text("Save and close")
                        .font(DFMTheme.title(17))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .foregroundStyle(DFMTheme.inkGreen)
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(DFMTheme.leafGreen, lineWidth: 2)
                        )
                }
            }
        }
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("One demo connection")
                .font(DFMTheme.title(16))
                .foregroundStyle(DFMTheme.inkGreen)

            Text("For this hackathon build, every app account is connected through the same tunnel-backed demo notebook. The connection key is saved automatically and is never displayed or spoken aloud.")
                .font(DFMTheme.hand(18))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.75))
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Pieces

    private func card<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(DFMTheme.cream)
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(DFMTheme.leafGreen.opacity(0.35), lineWidth: 1.5)
            )
    }

    // MARK: - Actions

    private func runConnectionTest() {
        guard !isTesting else { return }
        isTesting = true
        testMessage = nil
        testSucceeded = false

        Task {
            let api = DFMAPI()
            do {
                let me = try await api.me()
                let who = me.email ?? me.name ?? me.id ?? "your account"
                await MainActor.run {
                    testSucceeded = true
                    testMessage = "Connected. Signed in as \(who)."
                    isTesting = false
                }
            } catch {
                let text: String
                if let apiError = error as? DFMAPIError {
                    text = apiError.errorDescription ?? "That didn't work."
                } else {
                    text = "That didn't work. Check the URL and your key."
                }
                await MainActor.run {
                    testSucceeded = false
                    testMessage = text
                    isTesting = false
                }
            }
        }
    }
}

#Preview {
    SettingsView()
}
