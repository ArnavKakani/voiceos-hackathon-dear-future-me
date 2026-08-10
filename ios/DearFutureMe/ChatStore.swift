//
//  ChatStore.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  Local, on-device memory of past voice conversations.
//
//  Why local and not the API: a conversation is not an entry. Entries are the
//  things you deliberately asked future you to keep, and they live on the
//  server. A chat is the raw material — it stays on the phone, it is never
//  uploaded here, and deleting it is instant and total.
//
//  Storage is one JSON file at Documents/chats.json:
//    - written atomically, so a crash mid-save can never truncate the file;
//    - read defensively, so a corrupt or hand-edited file degrades to "no
//      history" instead of taking the app down;
//    - capped at `maxSessions`, oldest dropped first.
//

import Foundation
import Observation

// MARK: - Models

/// One line of a stored conversation. `role` is "user" or "assistant", matching
/// `SessionController.messages`.
struct ChatLine: Codable, Identifiable, Sendable {
    var id: UUID
    var role: String
    var text: String
    var at: Date

    init(id: UUID = UUID(), role: String, text: String, at: Date) {
        self.id = id
        self.role = role
        self.text = text
        self.at = at
    }

    var isUser: Bool { role == "user" }
}

/// One stored conversation.
struct ChatSession: Codable, Identifiable, Sendable {
    var id: UUID
    var startedAt: Date
    var endedAt: Date?
    var messages: [ChatLine]

    init(id: UUID = UUID(), startedAt: Date, endedAt: Date?, messages: [ChatLine]) {
        self.id = id
        self.startedAt = startedAt
        self.endedAt = endedAt
        self.messages = messages
    }

    /// The first thing you said — the only honest one-line summary of a chat.
    var firstUserLine: String {
        for line in messages where line.isUser {
            return line.text
        }
        return messages.first?.text ?? ""
    }

    /// How many back-and-forths, counted the way a person would: one per thing
    /// you said.
    var turnCount: Int {
        messages.reduce(0) { $0 + ($1.isUser ? 1 : 0) }
    }

    /// Wall-clock length, or nil while the session never ended cleanly.
    var duration: TimeInterval? {
        guard let endedAt = endedAt else { return nil }
        let seconds = endedAt.timeIntervalSince(startedAt)
        return seconds > 0 ? seconds : nil
    }
}

// MARK: - Store

/// Reads and writes the local conversation history.
///
/// `@MainActor` on purpose: every reader is a SwiftUI view or the (already
/// main-actor) `SessionController`, the file is tiny, and single-actor ownership
/// removes any chance of two writers racing on the same JSON blob.
@Observable
@MainActor
final class ChatStore {

    /// The instance the app uses. Injectable elsewhere — see `init(fileURL:)`.
    static let shared = ChatStore()

    /// Hard ceiling on stored conversations. Oldest are dropped past this.
    static let maxSessions = 100

    /// Newest first, always. Views can bind straight to this.
    private(set) var sessions: [ChatSession] = []

    /// Where the JSON lives. Held so tests can point at a scratch file.
    @ObservationIgnored
    private let fileURL: URL

    // MARK: Lifecycle

    /// - Parameter fileURL: override the storage location (tests). When nil the
    ///   store uses `Documents/chats.json`.
    init(fileURL: URL? = nil) {
        self.fileURL = fileURL ?? ChatStore.defaultFileURL()
        self.sessions = ChatStore.read(from: self.fileURL)
    }

    // MARK: Reads

    /// All stored conversations, newest first.
    func all() -> [ChatSession] {
        sessions
    }

    /// One conversation by id, or nil.
    func session(with id: UUID) -> ChatSession? {
        sessions.first { $0.id == id }
    }

    // MARK: Writes

    /// Stores a conversation. Empty transcripts are ignored, and saving an id
    /// that already exists replaces it rather than duplicating it.
    func save(_ session: ChatSession) {
        guard !session.messages.isEmpty else { return }

        if let existing = sessions.firstIndex(where: { $0.id == session.id }) {
            sessions[existing] = session
        } else {
            sessions.append(session)
        }

        sort()
        trim()
        write()
    }

    /// Removes a conversation permanently. There is no undo, which is why every
    /// call site behind this shows a confirmation first.
    func delete(_ id: UUID) {
        let before = sessions.count
        sessions.removeAll { $0.id == id }
        guard sessions.count != before else { return }
        write()
    }

    /// Removes everything. Not wired to any button yet; here so a future
    /// "forget my chats" control in Settings is a one-liner.
    func deleteAll() {
        guard !sessions.isEmpty else { return }
        sessions.removeAll()
        write()
    }

    // MARK: - Private

    private func sort() {
        sessions.sort { $0.startedAt > $1.startedAt }
    }

    private func trim() {
        if sessions.count > ChatStore.maxSessions {
            sessions = Array(sessions.prefix(ChatStore.maxSessions))
        }
    }

    /// Writes the whole file atomically. Failures are swallowed: losing chat
    /// history is a disappointment, crashing mid-conversation is a bug.
    private func write() {
        let snapshot = sessions
        let url = fileURL
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            encoder.outputFormatting = [.prettyPrinted]
            let data = try encoder.encode(snapshot)
            try data.write(to: url, options: [.atomic])
        } catch {
            // Intentionally silent.
        }
    }

    /// Reads the file, tolerating every way it can be wrong: missing,
    /// unreadable, truncated, or valid JSON of the wrong shape.
    private static func read(from url: URL) -> [ChatSession] {
        guard let data = try? Data(contentsOf: url), !data.isEmpty else {
            return []
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard let decoded = try? decoder.decode([ChatSession].self, from: data) else {
            return []
        }
        return Array(decoded.sorted { $0.startedAt > $1.startedAt }.prefix(maxSessions))
    }

    private static func defaultFileURL() -> URL {
        let documents = FileManager.default
            .urls(for: .documentDirectory, in: .userDomainMask)
            .first
        let base = documents ?? URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)
        return base.appendingPathComponent("chats.json", isDirectory: false)
    }
}
