//
//  DFMAPI.swift
//  DearFutureMe
//
//  Thin typed client for the Dear Future Me REST API (FastAPI, /v1/*).
//  Auth is a personal API key sent as `x-api-key`.
//
//  Deliberately has NO delete method. VOICE_OS_PLAN.md §44 puts permanent
//  deletion in the "confirmation required" class; the cleanest way to comply
//  from a voice agent tonight is to not expose deletion at all. Do not add one
//  here without also adding a confirmation UI.
//

import Foundation

// MARK: - Errors

struct DFMAPIError: Error, LocalizedError, Sendable {

    /// HTTP status code, or 0 when the request never reached the server.
    let statusCode: Int

    /// Response body (truncated). Never contains an API key.
    let body: String

    var errorDescription: String? {
        switch statusCode {
        case 0:
            return "I couldn't reach Dear Future Me. Check your connection and try again."
        case 401, 403:
            return "Dear Future Me rejected the API key. Check your DFM key in Settings."
        case 404:
            return "That wasn't found on the server (404)."
        case 429:
            return "Too many requests right now. Give it a moment."
        case 500...599:
            return "The Dear Future Me server had a problem (\(statusCode))."
        default:
            if body.isEmpty {
                return "Dear Future Me returned an error (\(statusCode))."
            }
            return "Dear Future Me returned an error (\(statusCode)): \(body)"
        }
    }
}

// MARK: - Date helpers

/// ISO-8601 helpers. Everything is handled in UTC so a date-only string like
/// "2027-08-09" round-trips to "2027-08-09T00:00:00Z" without shifting a day.
enum DFMDate {

    private static func formatter(_ format: String) -> DateFormatter {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = format
        return f
    }

    /// Formats a Date as "2026-08-09T14:03:00Z".
    static func string(from date: Date) -> String {
        formatter("yyyy-MM-dd'T'HH:mm:ss'Z'").string(from: date)
    }

    /// Formats a Date as "2026-08-09" (used when we only care about the day).
    static func dayString(from date: Date) -> String {
        formatter("yyyy-MM-dd").string(from: date)
    }

    /// Parses the forms the model or the server is likely to hand us.
    static func date(from string: String) -> Date? {
        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return nil }
        let formats = [
            "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX",
            "yyyy-MM-dd'T'HH:mm:ssXXXXX",
            "yyyy-MM-dd'T'HH:mm:ss.SSS",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd"
        ]
        for format in formats {
            if let parsed = formatter(format).date(from: trimmed) {
                return parsed
            }
        }
        return nil
    }
}

// MARK: - Models
//
// Field names match the API/DB exactly (journals table extended in Phase 1),
// so no CodingKeys are needed. Everything is optional on purpose: a demo should
// degrade to "some fields missing", never to a decoding crash.

struct DFMEntry: Codable, Sendable {
    var journal_id: String?
    var user_id: String?
    var type: String?
    var title: String?
    var content: String?
    var transcript: String?
    var tags: [String]?
    var context: String?
    var entry_date: String?
    var revisit_at: String?
    var delivered_at: String?
    var created_at: String?
    var updated_at: String?
    var source: String?
    var provenance: String?
    var is_public: Bool?
}

struct DFMTimelineDay: Codable, Sendable {
    var date: String?
    var entries: [DFMEntry]?
}

struct DFMMe: Codable, Sendable {
    // Confirmed against api/_lib/service.py get_account(): returns the profiles
    // row {id, name, email, created_at} (or {"id": user_id} when no profile row).
    var id: String?
    var email: String?
    var name: String?
    var created_at: String?
}

// MARK: - Request bodies

private struct CreateEntryBody: Codable {
    var kind: String
    var content: String
    var title: String?
    var transcript: String?
    var tags: [String]?
    var context: String?
    var revisit_at: String?
}

private struct CreateLetterBody: Codable {
    var content: String
    var revisit_at: String
    var title: String?
    var tags: [String]?
    var context: String?
}

// MARK: - Client

struct DFMAPI: Sendable {

    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    // MARK: Writes

    /// POST /v1/entries — createReflection / createMemory / createProudMoment /
    /// createVoiceTimeCapsule / saveConversationAsReflection.
    /// `kind` is one of: reflection | memory | proud_moment | note | time_capsule.
    func createEntry(
        kind: String,
        title: String?,
        content: String,
        transcript: String?,
        tags: [String]?,
        context: String?,
        revisitAt: Date?
    ) async throws -> DFMEntry {
        let body = CreateEntryBody(
            kind: kind,
            content: content,
            title: emptyToNil(title),
            transcript: emptyToNil(transcript),
            tags: (tags?.isEmpty ?? true) ? nil : tags,
            context: emptyToNil(context),
            revisit_at: revisitAt.map { DFMDate.string(from: $0) }
        )
        let data = try await send(
            method: "POST",
            path: "/v1/entries",
            query: [],
            body: try JSONEncoder().encode(body)
        )
        return try decodeObject(DFMEntry.self, from: data)
    }

    /// POST /v1/letters — createFutureLetter. The server forces type='letter'
    /// and requires revisit_at (the delivery date).
    func createLetter(
        content: String,
        title: String?,
        revisitAt: Date,
        tags: [String]?,
        context: String?
    ) async throws -> DFMEntry {
        let body = CreateLetterBody(
            content: content,
            revisit_at: DFMDate.string(from: revisitAt),
            title: emptyToNil(title),
            tags: (tags?.isEmpty ?? true) ? nil : tags,
            context: emptyToNil(context)
        )
        let data = try await send(
            method: "POST",
            path: "/v1/letters",
            query: [],
            body: try JSONEncoder().encode(body)
        )
        return try decodeObject(DFMEntry.self, from: data)
    }

    // MARK: Reads

    /// GET /v1/entries — getReflectionHistory / getProudMoments / getRecentMemories.
    func getEntries(
        kind: String?,
        from: Date?,
        to: Date?,
        limit: Int?
    ) async throws -> [DFMEntry] {
        var query: [URLQueryItem] = []
        if let kind = emptyToNil(kind) {
            query.append(URLQueryItem(name: "kind", value: kind))
        }
        if let from = from {
            query.append(URLQueryItem(name: "from", value: DFMDate.string(from: from)))
        }
        if let to = to {
            query.append(URLQueryItem(name: "to", value: DFMDate.string(from: to)))
        }
        if let limit = limit {
            query.append(URLQueryItem(name: "limit", value: String(limit)))
        }
        let data = try await send(method: "GET", path: "/v1/entries", query: query, body: nil)
        return try decodeList(DFMEntry.self, from: data)
    }

    /// GET /v1/letters — getFutureLetters. `status` is "upcoming" or "past".
    func getLetters(status: String?) async throws -> [DFMEntry] {
        var query: [URLQueryItem] = []
        if let status = emptyToNil(status) {
            query.append(URLQueryItem(name: "status", value: status))
        }
        let data = try await send(method: "GET", path: "/v1/letters", query: query, body: nil)
        return try decodeList(DFMEntry.self, from: data)
    }

    /// GET /v1/search — searchMemories (Postgres full-text on the server).
    func search(q: String, kind: String?) async throws -> [DFMEntry] {
        var query: [URLQueryItem] = [URLQueryItem(name: "q", value: q)]
        if let kind = emptyToNil(kind) {
            query.append(URLQueryItem(name: "kind", value: kind))
        }
        let data = try await send(method: "GET", path: "/v1/search", query: query, body: nil)
        return try decodeList(DFMEntry.self, from: data)
    }

    /// GET /v1/timeline — getTimeline. Entries grouped by day, all kinds.
    func timeline(from: Date?, to: Date?) async throws -> [DFMTimelineDay] {
        var query: [URLQueryItem] = []
        if let from = from {
            query.append(URLQueryItem(name: "from", value: DFMDate.string(from: from)))
        }
        if let to = to {
            query.append(URLQueryItem(name: "to", value: DFMDate.string(from: to)))
        }
        let data = try await send(method: "GET", path: "/v1/timeline", query: query, body: nil)
        return try decodeList(DFMTimelineDay.self, from: data)
    }

    /// GET /v1/me — account context. Also the cheapest "is my key good?" probe,
    /// which is what SettingsView's Test connection button uses.
    func me() async throws -> DFMMe {
        let data = try await send(method: "GET", path: "/v1/me", query: [], body: nil)
        return try decodeObject(DFMMe.self, from: data)
    }

    // MARK: - Transport

    private func send(
        method: String,
        path: String,
        query: [URLQueryItem],
        body: Data?
    ) async throws -> Data {
        let request = try makeRequest(method: method, path: path, query: query, body: body)

        // One retry, and only for transport failures. A 4xx is never retried:
        // a bad key should tell the user once, not hammer the server (§0.4 #7,
        // Phase 7 anti-patterns).
        do {
            return try await performOnce(request)
        } catch let error as DFMAPIError {
            throw error
        } catch {
            do {
                return try await performOnce(request)
            } catch let retryError as DFMAPIError {
                throw retryError
            } catch {
                throw DFMAPIError(statusCode: 0, body: "")
            }
        }
    }

    private func performOnce(_ request: URLRequest) async throws -> Data {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw DFMAPIError(statusCode: 0, body: "")
        }
        guard (200...299).contains(http.statusCode) else {
            throw DFMAPIError(statusCode: http.statusCode, body: shortBody(data))
        }
        return data
    }

    private func makeRequest(
        method: String,
        path: String,
        query: [URLQueryItem],
        body: Data?
    ) throws -> URLRequest {
        // Build the URL by string so a trailing slash on the base (or a leading
        // slash on the path) can't produce "//v1/...".
        var baseString = DFMConfig.apiBaseURL.absoluteString
        while baseString.hasSuffix("/") {
            baseString.removeLast()
        }
        var suffix = path
        while suffix.hasPrefix("/") {
            suffix.removeFirst()
        }
        guard var components = URLComponents(string: baseString + "/" + suffix) else {
            throw DFMAPIError(statusCode: 0, body: "Bad base URL. Check it in Settings.")
        }
        if !query.isEmpty {
            components.queryItems = query
        }
        guard let url = components.url else {
            throw DFMAPIError(statusCode: 0, body: "Bad base URL. Check it in Settings.")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 30
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        // The key itself is never logged or echoed into an error.
        request.setValue(DFMConfig.dfmAPIKey, forHTTPHeaderField: "x-api-key")
        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        return request
    }

    // MARK: - Decoding

    private func decodeObject<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            // Some routes wrap the object, e.g. {"entry": {...}}.
            if let top = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                for key in ["entry", "letter", "data", "result", "item", "me", "user"] {
                    if let inner = top[key] as? [String: Any],
                       let sub = try? JSONSerialization.data(withJSONObject: inner),
                       let decoded = try? JSONDecoder().decode(T.self, from: sub) {
                        return decoded
                    }
                }
            }
            throw DFMAPIError(statusCode: 0, body: "Unexpected response shape from the server.")
        }
    }

    private func decodeList<T: Decodable>(_ type: T.Type, from data: Data) throws -> [T] {
        if let direct = try? JSONDecoder().decode([T].self, from: data) {
            return direct
        }
        if let top = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            let preferredKeys = [
                "entries", "letters", "results", "items", "data", "timeline", "days"
            ]
            for key in preferredKeys {
                if let array = top[key] as? [Any],
                   let sub = try? JSONSerialization.data(withJSONObject: array),
                   let decoded = try? JSONDecoder().decode([T].self, from: sub) {
                    return decoded
                }
            }
            for (_, value) in top {
                if let array = value as? [Any],
                   let sub = try? JSONSerialization.data(withJSONObject: array),
                   let decoded = try? JSONDecoder().decode([T].self, from: sub) {
                    return decoded
                }
            }
        }
        throw DFMAPIError(statusCode: 0, body: "Unexpected response shape from the server.")
    }

    // MARK: - Small helpers

    private func emptyToNil(_ value: String?) -> String? {
        guard let value = value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private func shortBody(_ data: Data) -> String {
        guard let text = String(data: data, encoding: .utf8) else { return "" }
        let collapsed = text
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if collapsed.count <= 300 { return collapsed }
        return String(collapsed.prefix(300)) + "…"
    }
}
