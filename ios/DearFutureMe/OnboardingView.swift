//
//  OnboardingView.swift
//  DearFutureMe
//
//  A two-step, hackathon-first onboarding: show the four demo-worthy voice
//  jobs, then create and connect a DFM account without sending the user to the
//  website. Passwords stay typed; names are explicitly spelling-confirmed.
//

import SwiftUI
import UIKit

private struct DFMOnboardingUseCase: Identifiable {
    let id: String
    let icon: String
    let title: String
    let prompt: String
    let color: Color
}

@MainActor
struct OnboardingView: View {

    /// `true` means Settings still needs to collect an existing DFM key.
    let onComplete: (Bool) -> Void

    @State private var page = 0
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var spellingConfirmed = false
    @State private var isCreating = false
    @State private var errorMessage: String?

    @FocusState private var focusedField: Field?

    private enum Field: Hashable {
        case name, email, password
    }

    private let useCases = [
        DFMOnboardingUseCase(
            id: "capture",
            icon: "sparkles",
            title: "Save a moment",
            prompt: "“I want to remember how today felt.”",
            color: DFMTheme.softBlue
        ),
        DFMOnboardingUseCase(
            id: "proud",
            icon: "hands.sparkles",
            title: "Keep a proud moment",
            prompt: "“I finally shipped the thing.”",
            color: DFMTheme.softPeach
        ),
        DFMOnboardingUseCase(
            id: "letter",
            icon: "envelope.badge",
            title: "Write future you",
            prompt: "“Open this again in six months.”",
            color: DFMTheme.softYellow
        ),
        DFMOnboardingUseCase(
            id: "past",
            icon: "clock.arrow.circlepath",
            title: "Ask your past",
            prompt: "“What was I worried about last spring?”",
            color: DFMTheme.softGreen
        ),
    ]

    var body: some View {
        ZStack {
            DFMBackground()
            ScrollView {
                Group {
                    if page == 0 {
                        tutorial
                    } else {
                        accountForm
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 38)
                .padding(.bottom, 34)
            }
        }
        .preferredColorScheme(.light)
        .tint(DFMTheme.leafGreen)
    }

    private var tutorial: some View {
        VStack(alignment: .leading, spacing: 22) {
            VStack(alignment: .leading, spacing: 7) {
                Text("Dear Future Me")
                    .font(DFMTheme.title(31))
                    .foregroundStyle(DFMTheme.inkGreen)
                Text("your life, kept in your own voice")
                    .font(DFMTheme.hand(23))
                    .foregroundStyle(DFMTheme.leafGreen.opacity(0.8))
            }

            Text("Tap once from the app, Home Screen, or Lock Screen. Talk naturally: DFM waits for you to finish, then helps you keep what matters.")
                .font(DFMTheme.body(16))
                .foregroundStyle(DFMTheme.inkGreen.opacity(0.78))
                .lineSpacing(4)

            VStack(spacing: 12) {
                ForEach(useCases) { useCase in
                    useCaseCard(useCase)
                }
            }

            primaryButton(title: "Set up my account", isBusy: false) {
                withAnimation(.easeInOut(duration: 0.25)) {
                    page = 1
                }
            }

        }
    }

    private func useCaseCard(_ useCase: DFMOnboardingUseCase) -> some View {
        HStack(spacing: 14) {
            Image(systemName: useCase.icon)
                .font(.system(size: 21, weight: .semibold))
                .foregroundStyle(DFMTheme.inkGreen)
                .frame(width: 48, height: 48)
                .background(useCase.color)
                .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))

            VStack(alignment: .leading, spacing: 4) {
                Text(useCase.title)
                    .font(DFMTheme.title(16))
                    .foregroundStyle(DFMTheme.inkGreen)
                Text(useCase.prompt)
                    .font(DFMTheme.hand(18))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.67))
            }

            Spacer(minLength: 0)
        }
        .padding(15)
        .background(DFMTheme.cream.opacity(0.88))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(DFMTheme.leafGreen.opacity(0.22), lineWidth: 1.3)
        }
    }

    private var accountForm: some View {
        VStack(alignment: .leading, spacing: 20) {
            Button {
                focusedField = nil
                withAnimation(.easeInOut(duration: 0.25)) { page = 0 }
            } label: {
                Label("Back", systemImage: "chevron.left")
                    .font(DFMTheme.title(14))
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Meet future you")
                    .font(DFMTheme.title(29))
                    .foregroundStyle(DFMTheme.inkGreen)
                Text("create your private notebook")
                    .font(DFMTheme.hand(22))
                    .foregroundStyle(DFMTheme.leafGreen.opacity(0.8))
            }

            VStack(alignment: .leading, spacing: 16) {
                onboardingField(
                    label: "Your name",
                    help: "Say it with keyboard dictation if you like, then check the spelling below.",
                    text: $name,
                    field: .name,
                    contentType: .name
                )

                Toggle(isOn: $spellingConfirmed) {
                    Text(name.isEmpty ? "I’ll check the spelling of my name" : "Yes, “\(name)” is spelled right")
                        .font(DFMTheme.hand(18))
                        .foregroundStyle(DFMTheme.inkGreen.opacity(0.78))
                }
                .tint(DFMTheme.leafGreen)
                .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                onboardingField(
                    label: "Email",
                    help: "Used to reconnect this same account on the web later.",
                    text: $email,
                    field: .email,
                    contentType: .emailAddress
                )
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)

                secureOnboardingField(
                    label: "Password",
                    help: "Type this privately—DFM will never ask you to say a password aloud.",
                    text: $password,
                    field: .password,
                    contentType: .newPassword
                )

            }
            .padding(20)
            .background(DFMTheme.cream.opacity(0.9))
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(DFMTheme.leafGreen.opacity(0.28), lineWidth: 1.3)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(DFMTheme.hand(18))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(DFMTheme.softPeach.opacity(0.25))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .fixedSize(horizontal: false, vertical: true)
            }

            primaryButton(title: "Create my account", isBusy: isCreating) {
                createAccount()
            }
            .disabled(!canCreate || isCreating)
            .opacity(canCreate ? 1 : 0.5)

            Text("Your app connects automatically through the secure DFM demo tunnel. There is no server address or API key to paste.")
                .font(DFMTheme.hand(16))
                .foregroundStyle(DFMTheme.inkGreen.opacity(0.55))
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func onboardingField(
        label: String,
        help: String,
        text: Binding<String>,
        field: Field,
        contentType: UITextContentType?
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(DFMTheme.title(14)).foregroundStyle(DFMTheme.inkGreen)
            TextField("", text: text)
                .textContentType(contentType)
                .focused($focusedField, equals: field)
                .font(DFMTheme.body(16))
                .padding(12)
                .background(DFMTheme.cream)
                .overlay(RoundedRectangle(cornerRadius: 13, style: .continuous).strokeBorder(DFMTheme.leafGreen.opacity(0.35), lineWidth: 2))
                .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
            Text(help)
                .font(DFMTheme.hand(16))
                .foregroundStyle(DFMTheme.inkGreen.opacity(0.6))
        }
    }

    private func secureOnboardingField(
        label: String,
        help: String,
        text: Binding<String>,
        field: Field,
        contentType: UITextContentType?
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label).font(DFMTheme.title(14)).foregroundStyle(DFMTheme.inkGreen)
            SecureField("", text: text)
                .textContentType(contentType)
                .focused($focusedField, equals: field)
                .font(DFMTheme.body(16))
                .padding(12)
                .background(DFMTheme.cream)
                .overlay(RoundedRectangle(cornerRadius: 13, style: .continuous).strokeBorder(DFMTheme.leafGreen.opacity(0.35), lineWidth: 2))
                .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
            Text(help)
                .font(DFMTheme.hand(16))
                .foregroundStyle(DFMTheme.inkGreen.opacity(0.6))
        }
    }

    private func primaryButton(
        title: String,
        isBusy: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if isBusy { ProgressView().tint(DFMTheme.cream) }
                Text(isBusy ? "Creating…" : title)
                    .font(DFMTheme.title(17))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .foregroundStyle(DFMTheme.cream)
            .background(DFMTheme.leafGreen)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private var canCreate: Bool {
        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        return !cleanName.isEmpty
            && spellingConfirmed
            && cleanEmail.contains("@")
            && password.count >= 8
    }

    private func createAccount() {
        guard canCreate, !isCreating else { return }
        focusedField = nil
        isCreating = true
        errorMessage = nil

        let cleanName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let cleanEmail = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()

        Task {
            do {
                let result = try await DFMAccountClient().createAccount(
                    name: cleanName,
                    email: cleanEmail,
                    password: password
                )
                DFMConfig.dfmAPIKey = result.api_key.key
                password = ""
                isCreating = false
                onComplete(false)
            } catch {
                password = ""
                isCreating = false
                errorMessage = (error as? LocalizedError)?.errorDescription
                    ?? "We couldn't create that account just now. Try again."
            }
        }
    }
}
