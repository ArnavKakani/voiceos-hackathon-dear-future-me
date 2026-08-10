//
//  DFMEntryIntent.swift
//  DearFutureMe  ←  APP TARGET ONLY
//
//  What the user was reaching for when they opened this session.
//
//  Two entry channels produce it and both are untrusted input:
//    • the widget's deep link  `dearfutureme://talk?intent=proud`
//    • WriteLetterIntent's     UserDefaults "dfm_pending_intent" = "letter"
//
//  An unrecognised value is not an error — it is a plain session.
//

import Foundation

enum DFMEntryIntent: String {
    case proud
    case letter
    case memory

    /// Must match `WriteLetterIntent.pendingIntentDefaultsKey` in TalkIntent.swift.
    static let pendingDefaultsKey = "dfm_pending_intent"

    /// Query parameter name on `dearfutureme://talk`.
    static let queryItemName = "intent"

    /// What the app says out loud the moment the session opens, before the
    /// model is involved at all. Spoken locally so the door opens instantly
    /// even on a slow network.
    var openingLine: String {
        switch self {
        case .proud:
            return "What are you proud of today?"
        case .letter:
            return "What should future you hear from today?"
        case .memory:
            return "What's worth remembering from today?"
        }
    }

    /// One sentence appended to the system prompt for this session, so the
    /// model carries on from the opening line instead of re-greeting.
    var seedContext: String {
        switch self {
        case .proud:
            return "They opened this session from the proud-moment shortcut, and you have already asked what they are proud of today, so take their answer from there and save it as a proud moment."
        case .letter:
            return "They opened this session from the write-a-letter shortcut, and you have already asked what future you should hear from today, so take their answer from there and shape it into a letter to their future self."
        case .memory:
            return "They opened this session from the keep-a-memory shortcut, and you have already asked what is worth remembering from today, so take their answer from there and save it as a memory."
        }
    }

    /// Reads and CLEARS the pending intent written by `WriteLetterIntent`.
    /// Clearing on read is what stops it leaking into the next session.
    static func consumePending() -> DFMEntryIntent? {
        let defaults = UserDefaults.standard
        guard let raw = defaults.string(forKey: pendingDefaultsKey) else { return nil }
        defaults.removeObject(forKey: pendingDefaultsKey)
        return DFMEntryIntent(rawValue: raw)
    }

    /// Parses `dearfutureme://talk?intent=proud`. Returns nil for the bare
    /// `dearfutureme://talk` and for any value we do not know.
    static func from(url: URL) -> DFMEntryIntent? {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let raw = components.queryItems?
                  .first(where: { $0.name.lowercased() == queryItemName })?
                  .value?
                  .lowercased()
        else { return nil }
        return DFMEntryIntent(rawValue: raw)
    }
}
