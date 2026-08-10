//
//  DFMWidget.swift
//  DFMWidget  ←  WIDGET EXTENSION TARGET ONLY (never the app target)
//
//  Dear Future Me — Voice OS hackathon, Phase 8: the widget suite.
//
//  What this widget is: a set of doors into an already-listening voice session.
//  Every tap opens some flavour of `dearfutureme://talk`, which DearFutureMeApp
//  handles in `.onOpenURL` and turns straight into a live microphone.
//  See ios/WIDGET_WIRING.md for the app-side half of that contract.
//
//  ── THE NO-APP-GROUP CONSTRAINT (read before adding anything) ────────────────
//  This project signs with a FREE Apple developer account. That means:
//    • no App Group, so the extension cannot read the app's UserDefaults,
//    • no shared container, so it cannot read the app's files,
//    • no API key in the extension, and no network from a TimelineProvider.
//  Therefore the widget has ZERO access to real user data. It never shows a
//  streak, a recent reflection or a real "upcoming letter" — inventing those
//  would be lying to the user about their own notebook. Everything on screen is
//  either a fixed invitation or derived from the entry's `date`. FUTURE_PLAN.md
//  §2B asks for "recent reflection / proud moment / upcoming letter" slots; we
//  honour the *shape* of that layout and fill the slots with invitations.
//
//  ANTI-PATTERN GUARD (VOICE_OS_PLAN.md §0.4 #10): a launcher uses `.widgetURL`
//  or `Link`, NOT `Button(intent:)`. An intent button runs the intent *without*
//  foregrounding the app, so the mic would never open. Do not "improve" these
//  into Buttons.
//
//  ANTI-PATTERN GUARD (same rule, second half): `Link` only works on the
//  system medium / large families. Small and every accessory family get ONE
//  `.widgetURL` for the whole surface — a tap anywhere is the same tap.
//
//  ANTI-PATTERN GUARD (Phase 8): no network calls in the TimelineProvider.
//  Everything below is local date arithmetic.
//
//  iOS 17+ only (uses `containerBackground(for: .widget)`, which iOS 17 requires
//  for every widget — a widget that paints its own background View instead is
//  rejected by the system and renders blank/clipped).
//

import SwiftUI
import UIKit
import WidgetKit

// MARK: - Widget-local theme
//
// DUPLICATED ON PURPOSE. The app target's `DFMTheme` (ios/DearFutureMe/Theme.swift)
// cannot be used here: a widget extension is a SEPARATE binary and can only see
// files whose Target Membership includes DFMWidget. Rather than share Theme.swift
// across both targets (which would drag its app-only dependencies along), the
// widget keeps this tiny self-contained copy of the same literal values.
// If a colour changes in DESIGN_SYSTEM.md, change it in BOTH places.

enum WidgetTheme {

    // DESIGN_SYSTEM.md §17 non-negotiables 1–2: cream, never white; green-tinted
    // text, never gray or black.
    static let cream = Color(red: 0.976, green: 0.961, blue: 0.929) // #F9F5ED
    static let inkGreen = Color(red: 0.227, green: 0.361, blue: 0.259) // #3A5C42
    static let leafGreen = Color(red: 0.365, green: 0.557, blue: 0.404) // #5D8E67

    // Four-accent pastel system (non-negotiable 7) — used at low opacity only.
    static let softYellow = Color(red: 0.996, green: 0.882, blue: 0.533) // #FEE188
    static let softPeach = Color(red: 1.000, green: 0.820, blue: 0.741) // #FFD1BD
    static let softGreen = Color(red: 0.624, green: 0.847, blue: 0.612) // #9FD89C
    static let softBlue = Color(red: 0.718, green: 0.890, blue: 1.000) // #B7E3FF

    /// Caveat, the handwritten half of the two-font tension (non-negotiable 4).
    ///
    /// Custom fonts are NOT inherited from the app: the .ttf files must also be
    /// members of the DFMWidget target AND listed in the widget's own Info
    /// "Fonts provided by application" (UIAppFonts). See ios/IOS_RUNBOOK.md §4.
    /// If that wiring is missing, this falls back to rounded system text so the
    /// widget still renders on-brand instead of silently drawing Helvetica.
    static func hand(_ size: CGFloat) -> Font {
        resolved(["Caveat-Regular", "Caveat"], size: size)
            ?? .system(size: size, weight: .regular, design: .rounded)
    }

    /// Comfortaa, the structured half.
    static func title(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        resolved(["Comfortaa-Regular", "Comfortaa"], size: size)
            ?? .system(size: size, weight: weight, design: .rounded)
    }

    /// UIFont is the only reliable way to ask "did this font actually register?"
    /// — `Font.custom` silently substitutes when the name is unknown.
    private static func resolved(_ names: [String], size: CGFloat) -> Font? {
        for name in names where UIFont(name: name, size: size) != nil {
            return .custom(name, size: size)
        }
        return nil
    }
}

// MARK: - Deep links
//
// One scheme, one host, one optional query parameter. The app parses `intent`
// and seeds the agent's opening line with it; the parsing snippet lives in
// ios/WIDGET_WIRING.md and must stay in sync with the raw values below.
//
//   dearfutureme://talk                 general — just start listening
//   dearfutureme://talk?intent=proud    open on "what are you proud of?"
//   dearfutureme://talk?intent=letter   open on a letter to future you
//   dearfutureme://talk?intent=memory   open on something worth keeping

enum DFMLink {

    static let base = "dearfutureme://talk"

    /// Non-optional by construction. `URL(string:)` cannot fail for these fixed
    /// literals, but a widget must never trap, so the fallback is the bare
    /// scheme rather than a force-unwrap.
    private static func make(_ string: String) -> URL {
        URL(string: string) ?? URL(string: base) ?? URL(fileURLWithPath: "/")
    }

    /// General: open the app already listening, no seeded topic.
    static let talk = make(base)
    /// `intent=proud` — the agent opens on a proud moment.
    static let proud = make("\(base)?intent=proud")
    /// `intent=letter` — the agent opens on a letter to future you.
    static let letter = make("\(base)?intent=letter")
    /// `intent=memory` — the agent opens on something worth keeping.
    static let memory = make("\(base)?intent=memory")
}

/// One tappable invitation: a label, a glyph, a pastel accent, a destination.
/// Used for the medium pills and the large cards so both stay in step.
struct DFMCallToAction: Identifiable {
    let id: String
    let label: String
    let systemImage: String
    let accent: Color
    let url: URL

    /// Open-ended. The prompt on screen is already the question.
    static let reflect = DFMCallToAction(
        id: "reflect",
        label: "Reflect",
        systemImage: "waveform",
        accent: WidgetTheme.softGreen,
        url: DFMLink.talk
    )

    static let proud = DFMCallToAction(
        id: "proud",
        label: "Proud moment",
        systemImage: "sparkles",
        accent: WidgetTheme.softYellow,
        url: DFMLink.proud
    )

    static let letter = DFMCallToAction(
        id: "letter",
        label: "Write future you",
        systemImage: "envelope",
        accent: WidgetTheme.softBlue,
        url: DFMLink.letter
    )

    static let memory = DFMCallToAction(
        id: "memory",
        label: "Keep a memory",
        systemImage: "bookmark",
        accent: WidgetTheme.softPeach,
        url: DFMLink.memory
    )

    /// Medium: the three the plan names (FUTURE_PLAN.md §2A quick actions).
    static let mediumSet = [reflect, proud, letter]

    /// Large: the letter gets its own invitation panel further down, so the
    /// card row carries the other three instead of repeating it.
    static let largeSet = [reflect, proud, memory]
}

// MARK: - Timeline

struct PromptEntry: TimelineEntry {
    let date: Date
    let prompt: String
}

/// The three ambient prompts from FUTURE_PLAN.md §2B (lines 79–81).
/// One per day, rotating — the widget changes without ever touching the network.
enum WidgetPrompts {
    static let all = [
        "What's worth remembering today?",
        "Tell Future You something.",
        "What are you proud of?"
    ]

    /// Deterministic day-indexed pick: every device shows the same prompt on the
    /// same calendar day, and the choice is stable across widget reloads.
    static func prompt(for date: Date) -> String {
        let startOfDay = Calendar.current.startOfDay(for: date)
        let dayNumber = Int(floor(startOfDay.timeIntervalSinceReferenceDate / 86_400))
        let index = ((dayNumber % all.count) + all.count) % all.count
        return all[index]
    }
}

/// The handwritten line at the top of the medium and large widgets.
///
/// Derived entirely from the entry's own date — weekday plus hour bucket — so it
/// is honest (it describes the moment you are looking at it, nothing else) and
/// costs nothing. This is why the timeline below is stamped every few hours
/// instead of once a day: the greeting is the part that goes stale fastest.
enum DayVoice {

    /// Hard-coded rather than `DateFormatter`, because the copy is deliberately
    /// lowercase handwriting and must not pick up a locale's capitalisation.
    static let weekdayNames = [
        "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
    ]

    static func greeting(for date: Date) -> String {
        let calendar = Calendar.current
        let weekdayIndex = (calendar.component(.weekday, from: date) - 1 + 7) % 7
        let weekday = weekdayNames[weekdayIndex]

        switch calendar.component(.hour, from: date) {
        case 0..<5:
            return "\(weekday), small hours — still awake?"
        case 5..<11:
            return "\(weekday) morning — what's ahead worth keeping?"
        case 11..<16:
            return "\(weekday) afternoon — anything worth keeping so far?"
        case 16..<21:
            return "\(weekday) evening — anything worth keeping?"
        default:
            return "\(weekday) night — one last thing for future you?"
        }
    }
}

struct DFMTimelineProvider: TimelineProvider {

    /// Three hours between entries: fine enough that the greeting matches the
    /// part of day you are actually in, coarse enough that two days of timeline
    /// is 17 entries rather than hundreds.
    private static let strideHours = 3
    private static let horizonHours = 48

    func placeholder(in context: Context) -> PromptEntry {
        PromptEntry(date: Date(), prompt: WidgetPrompts.all[0])
    }

    func getSnapshot(in context: Context, completion: @escaping (PromptEntry) -> Void) {
        completion(PromptEntry(date: Date(), prompt: WidgetPrompts.prompt(for: Date())))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PromptEntry>) -> Void) {
        // Zero network, zero background work — just pre-computed dates.
        let now = Date()
        let calendar = Calendar.current

        var entries: [PromptEntry] = [
            // Entry 0 must not be in the future, so it is stamped "now".
            PromptEntry(date: now, prompt: WidgetPrompts.prompt(for: now))
        ]

        // Walk forward from the next clean 3-hour mark so the greeting flips on
        // a tidy boundary rather than at whatever minute the widget was added.
        let hour = calendar.component(.hour, from: now)
        let nextBucketHour = ((hour / Self.strideHours) + 1) * Self.strideHours
        guard let dayStart = calendar.dateInterval(of: .day, for: now)?.start,
              let firstBoundary = calendar.date(byAdding: .hour, value: nextBucketHour, to: dayStart)
        else {
            completion(Timeline(entries: entries, policy: .atEnd))
            return
        }

        var offset = 0
        while offset <= Self.horizonHours {
            if let boundary = calendar.date(byAdding: .hour, value: offset, to: firstBoundary),
               boundary > now {
                entries.append(PromptEntry(date: boundary, prompt: WidgetPrompts.prompt(for: boundary)))
            }
            offset += Self.strideHours
        }

        // .atEnd: when the last entry is spent, WidgetKit asks for another batch.
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

// MARK: - Orb motif

/// A still frame of the app's breathing orb.
///
/// Widgets do NOT animate — WidgetKit renders static snapshots — so the "breath"
/// is expressed as layered gradients rather than motion. DESIGN_SYSTEM.md §17 #10
/// (slow, small motion) lives in the app; here it becomes soft, small contrast.
struct OrbMark: View {
    var size: CGFloat

    var body: some View {
        ZStack {
            // Outer halo — the glow the orb would be exhaling.
            Circle()
                .fill(
                    RadialGradient(
                        colors: [WidgetTheme.softYellow.opacity(0.45), WidgetTheme.softPeach.opacity(0.0)],
                        center: .center,
                        startRadius: size * 0.18,
                        endRadius: size * 0.78
                    )
                )
                .frame(width: size * 1.5, height: size * 1.5)

            // Body of the orb.
            Circle()
                .fill(
                    LinearGradient(
                        colors: [WidgetTheme.softGreen.opacity(0.85), WidgetTheme.leafGreen.opacity(0.75)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: size, height: size)

            // Rim — 2px-feel border, non-negotiable 6.
            Circle()
                .strokeBorder(WidgetTheme.leafGreen.opacity(0.30), lineWidth: 2)
                .frame(width: size, height: size)

            // Highlight, offset up-left: asymmetry is intentional (§17 #11).
            Circle()
                .fill(
                    RadialGradient(
                        colors: [WidgetTheme.cream.opacity(0.75), WidgetTheme.cream.opacity(0.0)],
                        center: .center,
                        startRadius: 0,
                        endRadius: size * 0.30
                    )
                )
                .frame(width: size * 0.52, height: size * 0.52)
                .offset(x: -size * 0.14, y: -size * 0.16)

            // Inner mic mark, so the affordance reads at a glance.
            Image(systemName: "mic.fill")
                .font(.system(size: size * 0.30, weight: .medium))
                .foregroundStyle(WidgetTheme.cream.opacity(0.92))
        }
        .frame(width: size * 1.5, height: size * 1.5)
    }
}

/// The monochrome glyph used on Lock Screen / accessory families, where the
/// system tints everything a single colour and gradients disappear.
/// A pencil, not a mic: on the Lock Screen the promise is "write to future
/// you," and the pencil reads as intent rather than recording.
struct AccessoryOrbGlyph: View {
    var size: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .strokeBorder(Color.primary.opacity(0.55), lineWidth: max(1.5, size * 0.06))
            Image(systemName: "pencil")
                .font(.system(size: size * 0.50, weight: .semibold))
        }
        .frame(width: size, height: size)
        .widgetAccentable()
    }
}

/// Faint ruled lines, the widget's version of `.bg-lined` (§17 #9): it marks a
/// surface you are meant to write on. Used behind the large widget's letter
/// invitation and nowhere else, so the cue keeps its meaning.
struct LinedPaper: View {
    var spacing: CGFloat = 13

    var body: some View {
        GeometryReader { geometry in
            Path { path in
                var y = spacing
                while y < geometry.size.height {
                    path.move(to: CGPoint(x: 0, y: y))
                    path.addLine(to: CGPoint(x: geometry.size.width, y: y))
                    y += spacing
                }
            }
            .stroke(WidgetTheme.leafGreen.opacity(0.14), lineWidth: 1)
        }
    }
}

// MARK: - Entry view

struct DFMWidgetEntryView: View {
    // Not `private`: keeping every stored property internal guarantees the
    // synthesized memberwise init stays internal, so `DFMWidgetEntryView(entry:)`
    // is callable from the StaticConfiguration closure below.
    @Environment(\.widgetFamily) var family
    var entry: PromptEntry

    var body: some View {
        content
            // The default destination for the whole surface. On small and the
            // accessories this is the ONLY link (anti-pattern #10). On medium
            // and large the inner `Link`s take precedence where they cover, and
            // this catches every tap that lands on background instead.
            .widgetURL(DFMLink.talk)
            .containerBackground(for: .widget) { background }
    }

    @ViewBuilder
    private var content: some View {
        switch family {
        case .systemSmall:
            smallView
        case .systemMedium:
            mediumView
        case .systemLarge:
            largeView
        case .accessoryCircular:
            circularView
        case .accessoryRectangular:
            rectangularView
        case .accessoryInline:
            inlineView
        default:
            smallView
        }
    }

    private var greeting: String {
        DayVoice.greeting(for: entry.date)
    }

    // MARK: Home Screen — small
    //
    // Unchanged in spirit: the orb launcher, and nothing competing with it.
    // Single `.widgetURL`, so the whole square is one target.

    private var smallView: some View {
        VStack(alignment: .leading, spacing: 0) {
            wordmark

            Spacer(minLength: 4)

            OrbMark(size: 40)
                .frame(maxWidth: .infinity, alignment: .center)

            Spacer(minLength: 4)

            Text(entry.prompt)
                .font(WidgetTheme.hand(19))
                .foregroundStyle(WidgetTheme.inkGreen.opacity(0.80))
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    // MARK: Home Screen — medium
    //
    // §2B medium: today's prompt, the voice affordance, and quick actions.
    // The "streak / recent reflection indicator" the plan asks for is replaced
    // by the day-aware greeting: it is the only line we can write truthfully
    // without reading the user's notebook.

    private var mediumView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Link(destination: DFMLink.talk) {
                HStack(alignment: .top, spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        greetingLine(size: 15)

                        Text(entry.prompt)
                            .font(WidgetTheme.hand(24))
                            .foregroundStyle(WidgetTheme.inkGreen.opacity(0.80))
                            .lineLimit(2)
                            .minimumScaleFactor(0.6)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Spacer(minLength: 4)

                    OrbMark(size: 34)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                // An empty-looking HStack still has to be tappable across its
                // whole width, and a clear fill is what gives it hit area.
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            Spacer(minLength: 0)

            HStack(spacing: 6) {
                ForEach(DFMCallToAction.mediumSet) { action in
                    Link(destination: action.url) {
                        pill(action)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    // MARK: Home Screen — large
    //
    // §2B large, adapted to the no-data constraint. The plan's "recent
    // reflection / proud moment / upcoming Future Letter" rows become one hero
    // prompt, three intent cards, and an invitation where the letter would be.
    // Nothing here claims to be the user's own content.

    private var largeView: some View {
        VStack(alignment: .leading, spacing: 10) {
            Link(destination: DFMLink.talk) {
                HStack(alignment: .top, spacing: 10) {
                    VStack(alignment: .leading, spacing: 3) {
                        greetingLine(size: 16)

                        Text(entry.prompt)
                            .font(WidgetTheme.hand(30))
                            .foregroundStyle(WidgetTheme.inkGreen.opacity(0.85))
                            .lineLimit(3)
                            .minimumScaleFactor(0.6)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Spacer(minLength: 4)

                    OrbMark(size: 42)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            HStack(spacing: 8) {
                ForEach(DFMCallToAction.largeSet) { action in
                    Link(destination: action.url) {
                        card(action)
                    }
                    .buttonStyle(.plain)
                }
            }

            Link(destination: DFMLink.letter) {
                letterInvitation
            }
            .buttonStyle(.plain)

            Spacer(minLength: 0)

            wordmark
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    // MARK: Lock Screen — circular

    private var circularView: some View {
        AccessoryOrbGlyph(size: 42)
    }

    // MARK: Lock Screen — rectangular

    private var rectangularView: some View {
        HStack(spacing: 8) {
            Image(systemName: "pencil")
                .font(.system(size: 16, weight: .semibold))
                .widgetAccentable()

            VStack(alignment: .leading, spacing: 1) {
                Text("Dear Future Me")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .widgetAccentable()
                // The prompt with its question mark trimmed reads better as a
                // Lock Screen sub-line: it is an invitation, not an interrogation.
                Text(rectangularPromptLine)
                    .font(.system(size: 12, weight: .regular, design: .rounded))
                    .opacity(0.85)
                    .lineLimit(2)
                    .minimumScaleFactor(0.75)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    /// "What are you proud of?" → "Tap: what are you proud of?"
    private var rectangularPromptLine: String {
        let prompt = entry.prompt
        guard let first = prompt.first else { return "Tap to talk" }
        return "Tap: " + first.lowercased() + prompt.dropFirst()
    }

    // MARK: Lock Screen — inline
    //
    // Inline renders as one line of system-tinted text beside the clock. Only
    // Text / Image / a Label of the two survive; anything else is dropped.

    private var inlineView: some View {
        Label("Tell future you something", systemImage: "pencil")
    }

    // MARK: Pieces

    private var wordmark: some View {
        Text("Dear Future Me")
            .font(WidgetTheme.title(10))
            .tracking(0.4)
            .foregroundStyle(WidgetTheme.leafGreen.opacity(0.70))
            .lineLimit(1)
            .minimumScaleFactor(0.8)
    }

    /// The day-aware handwritten line. Lower opacity than the prompt so the
    /// hierarchy is carried by opacity, not by a second colour (§17 #8).
    private func greetingLine(size: CGFloat) -> some View {
        Text(greeting)
            .font(WidgetTheme.hand(size))
            .foregroundStyle(WidgetTheme.leafGreen.opacity(0.70))
            .lineLimit(1)
            .minimumScaleFactor(0.6)
    }

    /// Medium: rounded-full pill, 2px border, low-opacity pastel fill
    /// (§17 #5, #6, #7). `maxWidth: .infinity` makes the three share the row
    /// evenly, which is what guarantees "Write future you" always fits.
    private func pill(_ action: DFMCallToAction) -> some View {
        HStack(spacing: 4) {
            Image(systemName: action.systemImage)
                .font(.system(size: 9, weight: .medium))
            Text(action.label)
                .font(WidgetTheme.title(10))
                .lineLimit(1)
                .minimumScaleFactor(0.55)
        }
        .foregroundStyle(WidgetTheme.inkGreen.opacity(0.80))
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity)
        .background(Capsule().fill(action.accent.opacity(0.35)))
        .overlay(Capsule().strokeBorder(WidgetTheme.leafGreen.opacity(0.30), lineWidth: 2))
        .contentShape(Capsule())
    }

    /// Large: the same invitation as a `rounded-2xl` card (§17 #5).
    private func card(_ action: DFMCallToAction) -> some View {
        VStack(spacing: 5) {
            Image(systemName: action.systemImage)
                .font(.system(size: 15, weight: .medium))
            Text(action.label)
                .font(WidgetTheme.title(10))
                .lineLimit(2)
                .minimumScaleFactor(0.6)
                .multilineTextAlignment(.center)
        }
        .foregroundStyle(WidgetTheme.inkGreen.opacity(0.80))
        .padding(.horizontal, 6)
        .padding(.vertical, 11)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(action.accent.opacity(0.32))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(WidgetTheme.leafGreen.opacity(0.28), lineWidth: 2)
        )
        .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    /// Where FUTURE_PLAN.md §2B wants "upcoming Future Letter".
    ///
    /// We cannot read the user's letters, so this is written as an opening
    /// rather than a report. It never implies a letter exists — it says one
    /// could, and offers to start it.
    private var letterInvitation: some View {
        HStack(spacing: 9) {
            Image(systemName: "envelope")
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(WidgetTheme.leafGreen.opacity(0.75))

            Text("a letter to future you could be waiting here — write one")
                .font(WidgetTheme.hand(17))
                .foregroundStyle(WidgetTheme.inkGreen.opacity(0.70))
                .lineLimit(2)
                .minimumScaleFactor(0.6)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .padding(.horizontal, 11)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(WidgetTheme.softBlue.opacity(0.22))
                .overlay(LinedPaper().clipShape(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                ))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(WidgetTheme.leafGreen.opacity(0.22), lineWidth: 2)
        )
        .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    @ViewBuilder
    private var background: some View {
        switch family {
        case .accessoryCircular:
            // The system-provided translucent platter; anything else looks wrong
            // over an arbitrary Lock Screen wallpaper.
            AccessoryWidgetBackground()
        case .accessoryRectangular, .accessoryInline:
            // Accessory text families are intentionally background-free.
            Color.clear
        default:
            ZStack {
                WidgetTheme.cream
                // A warm off-centre wash instead of a flat card — the paper feel.
                RadialGradient(
                    colors: [WidgetTheme.softYellow.opacity(0.22), WidgetTheme.cream.opacity(0.0)],
                    center: UnitPoint(x: 0.78, y: 0.16),
                    startRadius: 0,
                    endRadius: 190
                )
            }
        }
    }
}

// MARK: - Widget

struct DFMWidget: Widget {
    let kind = "DFMWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DFMTimelineProvider()) { entry in
            DFMWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Talk to Future You")
        .description("One tap opens Dear Future Me already listening.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}

// MARK: - Previews
//
// Xcode 15+ macro previews. Harmless at runtime; delete if the Xcode version in
// use predates the #Preview macro for widgets.

#Preview("Small", as: .systemSmall) {
    DFMWidget()
} timeline: {
    PromptEntry(date: Date(), prompt: WidgetPrompts.all[0])
    PromptEntry(date: Date(), prompt: WidgetPrompts.all[1])
}

#Preview("Medium", as: .systemMedium) {
    DFMWidget()
} timeline: {
    PromptEntry(date: Date(), prompt: WidgetPrompts.all[2])
}

#Preview("Large", as: .systemLarge) {
    DFMWidget()
} timeline: {
    PromptEntry(date: Date(), prompt: WidgetPrompts.all[0])
}

#Preview("Circular", as: .accessoryCircular) {
    DFMWidget()
} timeline: {
    PromptEntry(date: Date(), prompt: WidgetPrompts.all[0])
}

#Preview("Rectangular", as: .accessoryRectangular) {
    DFMWidget()
} timeline: {
    PromptEntry(date: Date(), prompt: WidgetPrompts.all[1])
}

#Preview("Inline", as: .accessoryInline) {
    DFMWidget()
} timeline: {
    PromptEntry(date: Date(), prompt: WidgetPrompts.all[1])
}
