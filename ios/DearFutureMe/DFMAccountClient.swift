//
//  DFMAccountClient.swift
//  DearFutureMe
//
//  First-run account creation. The password is sent only to the DFM backend;
//  the backend creates the Supabase account and returns a one-time personal
//  DFM API key. No Supabase service credential is shipped in the app.
//

import Foundation

struct DFMAccount: Decodable, Sendable {
    let id: String
    let email: String
    let name: String
}

struct DFMIssuedKey: Decodable, Sendable {
    let key: String
}

struct DFMAccountSignupResult: Decodable, Sendable {
    let account: DFMAccount
    let api_key: DFMIssuedKey
}

private struct DFMAccountSignupBody: Encodable {
    let name: String
    let email: String
    let password: String
}

private struct DFMAccountErrorEnvelope: Decodable {
    let detail: String?
}

struct DFMAccountClientError: Error, LocalizedError, Sendable {
    let message: String

    var errorDescription: String? { message }
}

struct DFMAccountClient: Sendable {

    func createAccount(
        name: String,
        email: String,
        password: String
    ) async throws -> DFMAccountSignupResult {
        let url = DFMConfig.apiBaseURL
            .appendingPathComponent("v1")
            .appendingPathComponent("onboarding")
            .appendingPathComponent("signup")

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(
            DFMAccountSignupBody(name: name, email: email, password: password)
        )

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw DFMAccountClientError(message: "The server didn't answer normally. Try again.")
        }

        guard (200..<300).contains(http.statusCode) else {
            let envelope = try? JSONDecoder().decode(DFMAccountErrorEnvelope.self, from: data)
            throw DFMAccountClientError(
                message: envelope?.detail ?? "We couldn't create that account just now. Try again."
            )
        }

        do {
            return try JSONDecoder().decode(DFMAccountSignupResult.self, from: data)
        } catch {
            throw DFMAccountClientError(message: "The account was created, but setup did not finish. Contact us before trying again.")
        }
    }
}
