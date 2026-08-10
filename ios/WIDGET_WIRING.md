# Widget wiring

The app-side half of the widget contract. Everything here is a paste-in snippet —
none of it has been applied to `ios/DearFutureMe/`.

Apply in order. Steps A–C make intent-specific taps work. Steps D–E make them
*feel* different (the agent opens on the right question). A–C alone are safe to
ship on their own: an unhandled intent falls back to a plain listening session.

---

## 0. What the widgets emit

### Deep links

The widget extension has no App Group, no shared container and no API key, so a
URL is the only thing it can hand the app.

| Family / element | URL | Meaning |
| --- | --- | --- |
| systemSmall (whole surface, `.widgetURL`) | `dearfutureme://talk` | Start listening. No topic. |
| accessoryCircular / Rectangular / Inline (whole surface, `.widgetURL`) | `dearfutureme://talk` | Same. |
| systemMedium — greeting + prompt + orb (`Link`) | `dearfutureme://talk` | Same. |
| systemMedium — "Reflect" pill (`Link`) | `dearfutureme://talk` | Same. |
| systemMedium — "Proud moment" pill (`Link`) | `dearfutureme://talk?intent=proud` | Open on a proud moment. |
| systemMedium — "Write future you" pill (`Link`) | `dearfutureme://talk?intent=letter` | Open on a letter. |
| systemLarge — hero prompt + orb (`Link`) | `dearfutureme://talk` | Start listening. No topic. |
| systemLarge — "Reflect" card (`Link`) | `dearfutureme://talk` | Same. |
| systemLarge — "Proud moment" card (`Link`) | `dearfutureme://talk?intent=proud` | Open on a proud moment. |
| systemLarge — "Keep a memory" card (`Link`) | `dearfutureme://talk?intent=memory` | Open on something worth keeping. |
| systemLarge — letter invitation panel (`Link`) | `dearfutureme://talk?intent=letter` | Open on a letter. |
| systemMedium / systemLarge background (`.widgetURL` fallback) | `dearfutureme://talk` | Any tap that misses a `Link`. |

Three query values exist and no more: `proud`, `letter`, `memory`. Anything else,
including a missing `intent`, means "general".

The widget-side definitions live in `ios/DFMWidget/DFMWidget.swift` → `enum DFMLink`
and `struct DFMCallToAction`. Change one side, change the other — the two targets
are separate binaries and cannot share a constant.

### UserDefaults key

`WriteLetterIntent` (Siri / Spotlight / Action Button) cannot pass a URL, so it
writes a key instead, then posts `.dfmStartListening`:

```
UserDefaults.standard  →  "dfm_pending_intent" = "letter"
```

`UserDefaults.standard`, not a shared suite: the intent runs **in-process**
(`openAppWhenRun = true`), so it is writing the app's own defaults. This is the
only reason it works without an App Group — the widget extension is a different
process and could not do the same thing.

The app **must remove the key once it is read**. Leave it and every session for
the rest of the install opens as a letter.

---

## A. New file: `ios/DearFutureMe/DFMEntryIntent.swift`

App target. One type that both channels (URL and defaults) normalise into.

```swift
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
```

---

## B. `DearFutureMeApp.swift` — `RootView`

Three edits. The existing `startRequests` counter keeps its job; the intent rides
alongside it.

**B1.** Add one `@State` next to `startRequests`:

```swift
    /// What the current start request was reaching for, if anything.
    /// Read once by `VoiceSessionView` when it acts on `startRequests`.
    @State private var entryIntent: DFMEntryIntent?
```

**B2.** Pass it down, and pick up the App Intent's key. Replace the head of `body`:

```swift
        VoiceSessionView(startRequests: startRequests, entryIntent: entryIntent)
            .overlay(alignment: .topTrailing) {
                settingsButton
            }
            .preferredColorScheme(.light)
            .tint(DFMTheme.leafGreen)
            .onAppear {
                // Cold launch from Siri / Action Button: WriteLetterIntent wrote
                // the key before this view existed.
                if let pending = DFMEntryIntent.consumePending() {
                    entryIntent = pending
                }
            }
            .onOpenURL { url in
                handleDeepLink(url)
            }
            .onReceive(NotificationCenter.default.publisher(for: .dfmStartListening)) { _ in
                // Warm launch from Siri / Action Button: the key was written
                // immediately before this notification was posted.
                entryIntent = DFMEntryIntent.consumePending()
                startRequests += 1
            }
```

**B3.** Replace `handleDeepLink(_:)` whole:

```swift
    /// Accepts `dearfutureme://talk` (and the `dearfutureme:///talk` spelling
    /// some launchers produce), with an optional `?intent=proud|letter|memory`
    /// from the medium/large widget CTAs. Anything else is ignored rather than
    /// treated as a start request.
    private func handleDeepLink(_ url: URL) {
        guard url.scheme?.lowercased() == "dearfutureme" else { return }

        let host = url.host?.lowercased() ?? ""
        let path = url.path.lowercased()

        if host == "talk" || path == "/talk" || (host.isEmpty && path.isEmpty) {
            // Set the intent BEFORE bumping the counter: the counter is what
            // VoiceSessionView watches, and it reads the intent in the same tick.
            entryIntent = DFMEntryIntent.from(url: url)
            startRequests += 1
        }
    }
```

---

## C. `VoiceSessionView.swift`

**C1.** Add the property beside `startRequests`:

```swift
    /// What this start request was reaching for. `nil` = a plain session.
    var entryIntent: DFMEntryIntent?
```

**C2.** Both start sites pass it through — in `.onAppear` and in
`.onChange(of: startRequests)`, change `session.startSession()` to:

```swift
                session.startSession(intent: entryIntent)
```

Nothing else in the view changes. `startSession()` keeps working for the orb tap
because of the default argument in step D.

---

## D. `SessionController.swift`

**D1.** Change the signature of `startSession()` and hand the seed to the agent.
The default argument keeps every existing call site (`handleOrbTap`, onboarding)
compiling untouched.

```swift
    /// Starts a conversation: asks for permissions if needed, then listens.
    /// Safe to call when a session is already running (does nothing).
    ///
    /// - Parameter intent: what the entry point was reaching for. When set, the
    ///   session opens by speaking `intent.openingLine` instead of waiting in
    ///   silence, and the agent is seeded so it does not greet a second time.
    func startSession(intent: DFMEntryIntent? = nil) {
        guard state == .idle, !sessionActive else { return }

        lastError = nil
        sessionActive = true

        Task { @MainActor in
            // Seed before the first turn, not after: the agent must already
            // know the topic when the user's first sentence arrives.
            await self.agent.setEntrySeed(intent?.seedContext)

            let granted = await self.speech.requestPermissions()
            guard self.sessionActive else { return }

            guard granted else {
                self.lastError = "Microphone and speech access are needed to talk."
                self.sessionActive = false
                self.speakLine(SessionController.permissionLine, recordAsAssistant: false)
                return
            }

            if let intent {
                // Speaking sets `state = .speaking`; `handleSpeechFinished()`
                // hands the turn back and starts listening, exactly as it does
                // after any agent reply. Do NOT also call `beginListening()`
                // here — that would cut the line off mid-word.
                self.speakLine(intent.openingLine, recordAsAssistant: true)
            } else {
                self.beginListening()
            }
        }
    }
```

**D2.** Confirm `handleSpeechFinished()` calls `beginListening()` when the
session is active. It already does (it is the normal turn hand-back). If that
ever changes, the `if let intent` branch above needs its own follow-on.

**D3.** `resetConversation()` should drop the seed too, so a cleared session is
genuinely clean:

```swift
        Task { @MainActor in
            await self.agent.setEntrySeed(nil)
            await self.agent.reset()
        }
```

---

## E. `AgentLoop.swift`

`AgentLoop` is an `actor`, so the setter is `await`-ed from `SessionController`
(already written that way above).

**E1.** Add a stored property beside `messages`:

```swift
    /// One sentence describing how this session was opened, appended to the
    /// system prompt for its lifetime. Nil for a plain orb-tap session.
    private var entrySeed: String?
```

**E2.** Add the setter next to `reset()`:

```swift
    /// Sets (or clears) the entry-point context for this session.
    /// Call before the first `respond(to:)`; later calls take effect on the
    /// next turn.
    func setEntrySeed(_ seed: String?) {
        entrySeed = seed
    }
```

**E3.** Use it at the send site. `fullSystemPrompt` stays `let`; the seed is
composed at call time so it can be cleared without rebuilding the prompt.

```swift
    /// The system prompt for this turn: the persona, plus how the user got here.
    private var systemForTurn: String {
        guard let entrySeed, !entrySeed.isEmpty else { return fullSystemPrompt }
        return fullSystemPrompt + "\n\nHOW THIS SESSION WAS OPENED\n" + entrySeed
    }
```

Then in `respond(to:)`, change the `claude.send` call:

```swift
            let response = try await claude.send(
                system: systemForTurn,
                tools: DFMTools.schemas,
                messages: messages
            )
```

**E4.** If `serverTurn(_:)` (thin-phone mode) forwards a system prompt, pass
`systemForTurn` there too. If it does not take one, the seed is silently ignored
on thin phones and the opening line from step D still plays — acceptable.

---

## F. What the widgets assume

Check these before blaming the widget code.

1. **URL scheme `dearfutureme` is registered on the app target.** Already in
   `ios/project.yml` under `CFBundleURLTypes`. Without it, every tap opens the
   app at its last screen and no link fires.
2. **The widget extension has its own font copies.** `ios/project.yml` already
   adds `DearFutureMe/Fonts` as a resource folder to `DFMWidget` and lists
   `UIAppFonts` in the extension's Info. If either is dropped, `WidgetTheme.hand`
   and `.title` fall back to rounded system text — on-brand, but not the same
   widget.
3. **No App Group, and no plan to add one.** The widget shows no streak, no
   recent reflection and no real letter, because it cannot read any of them.
   The large widget's letter panel is worded as an invitation for exactly this
   reason. If an App Group is ever added, that panel is the first thing to
   upgrade to real data — and the wording must change with it.
4. **`Link` is only wired for `.systemMedium` and `.systemLarge`.** Small and
   the three accessory families deliberately keep one `.widgetURL` for the whole
   surface (VOICE_OS_PLAN.md §0.4 anti-pattern #10). Adding a `Link` to a small
   widget does nothing useful.
5. **No `Button(intent:)` anywhere in the widget.** An intent button runs in the
   background without foregrounding the app, so the microphone never opens.
6. **Timeline entries are stamped every 3 hours over a 48-hour horizon,
   `policy: .atEnd`.** That is what keeps the day-aware greeting honest. The
   prompt itself still rotates once per calendar day. Nothing touches the
   network.
7. **`WriteLetterIntent` needs `.dfmStartListening` to still exist** in
   `DearFutureMeApp.swift`, and needs whoever observes it to call
   `DFMEntryIntent.consumePending()` (step B2). Without step B2 the shortcut
   still opens a working session — just a generic one, with a stale key left
   behind in defaults.
8. **Siri phrases are registered at build time.** `WriteLetterIntent` is exposed
   as "Write to future me in Dear Future Me" / "Write a letter in Dear Future
   Me". A phrase without `\(.applicationName)` is dropped silently, so do not
   trim it out.

---

## G. Manual test pass

Once A–E are applied:

| Step | Expected |
| --- | --- |
| Safari → `dearfutureme://talk` | App opens, orb listening, no spoken opening line. |
| Safari → `dearfutureme://talk?intent=proud` | App opens and says "What are you proud of today?", then listens. |
| Safari → `dearfutureme://talk?intent=letter` | "What should future you hear from today?" |
| Safari → `dearfutureme://talk?intent=memory` | "What's worth remembering from today?" |
| Safari → `dearfutureme://talk?intent=banana` | Same as the bare link. No crash, no spoken line. |
| Medium widget, tap each pill | Matches the table in §0. |
| Large widget, tap each card + the letter panel | Matches the table in §0. |
| Large widget, tap empty background | Plain listening session. |
| "Hey Siri, write a letter in Dear Future Me" | App opens and says the letter line. |
| Immediately tap the orb for a second session | Plain session — the key was cleared. |
| Lock Screen inline / circular / rectangular | Pencil glyph, plain session. |
