//
//  AgentLoop.swift
//  DearFutureMe
//
//  Thin VoiceOS conversation client. The phone owns speech input, display,
//  local chat history, and ElevenLabs playback. VoiceOS is the only agent that
//  creates conversational responses; there is no provider or on-device model
//  fallback in this app.
//

import Foundation

enum VoiceOSAgentError: LocalizedError {
    case unavailable
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .unavailable:
            return "VoiceOS couldn't answer just now."
        case .invalidResponse:
            return "VoiceOS returned an unreadable response."
        }
    }
}

actor AgentLoop {

    /// Rolling text history sent with every turn. VoiceOS receives enough
    /// context to continue the conversation even if its desktop session is
    /// recreated between mobile turns.
    private var history: [[String: String]] = []

    /// One sentence describing the shortcut that opened this session.
    private var entrySeed: String?

    private struct ServerTurnResponse: Decodable {
        let speech: String?
        let source: String?
    }

    func respond(to userText: String) async throws -> String {
        let text = userText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return "" }

        var request = URLRequest(
            url: DFMConfig.apiBaseURL
                .appendingPathComponent("v1")
                .appendingPathComponent("agent")
                .appendingPathComponent("turn")
        )
        request.httpMethod = "POST"
        request.timeoutInterval = 90
        request.setValue(DFMConfig.dfmAPIKey, forHTTPHeaderField: "x-api-key")
        request.setValue("application/json", forHTTPHeaderField: "content-type")

        var context = history
        if context.isEmpty, let entrySeed, !entrySeed.isEmpty {
            context.append(["role": "assistant", "text": entrySeed])
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "text": text,
            "history": context.suffix(8).map { $0 },
        ])

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw VoiceOSAgentError.unavailable
        }

        guard let http = response as? HTTPURLResponse, http.statusCode < 300 else {
            throw VoiceOSAgentError.unavailable
        }
        guard let decoded = try? JSONDecoder().decode(ServerTurnResponse.self, from: data),
              decoded.source == "voiceos"
        else {
            throw VoiceOSAgentError.invalidResponse
        }

        let speech = (decoded.speech ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let reply = speech.isEmpty ? "I'm here. Tell me a little more." : speech
        history.append(["role": "user", "text": text])
        history.append(["role": "assistant", "text": reply])
        return reply
    }

    func reset() {
        history.removeAll()
    }

    func setEntrySeed(_ seed: String?) {
        entrySeed = seed
    }
}
