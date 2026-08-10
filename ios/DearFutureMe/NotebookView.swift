//
//  NotebookView.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  Everything the app kept, one tap from the orb.
//
//  The voice screen stays the landing surface (FUTURE_PLAN.md §2A — "do not
//  force users through menus before speaking"). This is the drawer you open
//  afterwards: what you asked future you to hold (Kept), what has not arrived
//  yet (Letters), and the conversations themselves (Chats).
//
//  Design rules honoured here (DESIGN_SYSTEM.md §17):
//    1.  Cream ground — never white.        5.  rounded-2xl cards, rounded-full pills.
//    2.  Green-tinted text — never gray.    6.  2px borders on anything tappable.
//    4.  Comfortaa against Caveat.          7.  The four pastel accents, by prop.
//    8.  Hierarchy by opacity, not hue.     9.  Notebook grid on by default.
//    10. Motion slow and small.             11. Margin annotations, offset.
//
//  This file holds the shell and the pieces every tab shares. The tabs
//  themselves live in NotebookEntriesView.swift (Kept, Letters, entry detail)
//  and NotebookChatsView.swift (Chats, chat detail).
//
//  ANTI-PATTERN GUARD: no agent or tool logic here, and no networking beyond
//  calling the existing `DFMAPI` read methods.
//

import SwiftUI

// MARK: - Tabs

enum NotebookTab: String, CaseIterable, Identifiable {
    case kept
    case letters
    case chats

    var id: String { rawValue }

    var label: String {
        switch self {
        case .kept: return "Kept"
        case .letters: return "Letters"
        case .chats: return "Chats"
        }
    }
}

// MARK: - NotebookView

@MainActor
struct NotebookView: View {

    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var tab: NotebookTab = .kept
    @State private var appeared = false
    @Namespace private var segmentNamespace

    var body: some View {
        ZStack {
            NotebookPaper()

            VStack(spacing: 0.0) {
                header

                NotebookSegmentedControl(selection: $tab, namespace: segmentNamespace)
                    .padding(.horizontal, 24.0)
                    .padding(.top, 20.0)
                    .padding(.bottom, 12.0)

                tabContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .padding(.top, 20.0)
        }
        .overlay(alignment: .topTrailing) { closeButton }
        .preferredColorScheme(.light)
        .tint(DFMTheme.leafGreen)
        .opacity(appeared ? 1.0 : 0.0)
        .offset(y: appeared ? 0.0 : 6.0)
        .onAppear {
            withAnimation(.easeOut(duration: reduceMotion ? 0.0 : 0.5)) {
                appeared = true
            }
        }
    }

    // MARK: Header

    /// Left-aligned title with the annotation nudged off-axis (§17.11).
    private var header: some View {
        DFMScreenHeader(
            title: "Notebook",
            note: "everything future you is holding ✦"
        )
        .padding(.horizontal, 26.0)
        .padding(.trailing, 52.0)
    }

    private var closeButton: some View {
        Button {
            dismiss()
        } label: {
            Image(systemName: "xmark")
                .font(.system(size: 15.0, weight: .semibold))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.7))
                .frame(width: 42.0, height: 42.0)
                .background {
                    Circle()
                        .fill(DFMTheme.cream.opacity(0.85))
                        .overlay {
                            Circle().strokeBorder(
                                DFMTheme.leafGreen.opacity(0.25),
                                lineWidth: 2.0
                            )
                        }
                }
                .shadow(color: DFMTheme.shadowSoft, radius: 10.0, x: 0.0, y: 4.0)
        }
        .buttonStyle(.plain)
        .padding(.trailing, 22.0)
        .padding(.top, 12.0)
        .accessibilityLabel(Text("Close notebook"))
    }

    // MARK: Tabs

    @ViewBuilder
    private var tabContent: some View {
        switch tab {
        case .kept:
            KeptListView()
        case .letters:
            LettersListView()
        case .chats:
            ChatsListView()
        }
    }
}

// MARK: - Paper

/// The notebook ground: cream, a 28pt grid, and a whisper of green at the
/// edges. Calmer than `DFMBackground` on purpose — nothing drifts behind a list
/// you are trying to read.
struct NotebookPaper: View {
    var body: some View {
        ZStack {
            DFMTheme.cream

            PaperGrid(spacing: 28.0)

            RadialGradient(
                gradient: Gradient(colors: [
                    DFMTheme.leafGreen.opacity(0.0),
                    DFMTheme.leafGreen.opacity(0.05)
                ]),
                center: .center,
                startRadius: 200.0,
                endRadius: 620.0
            )
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }
}

// MARK: - Segmented control

/// A rounded-full three-way switch. The selected pill slides rather than
/// blinking (§17.10: slow and small).
struct NotebookSegmentedControl: View {

    @Binding var selection: NotebookTab
    var namespace: Namespace.ID

    var body: some View {
        HStack(spacing: 4.0) {
            ForEach(NotebookTab.allCases) { tab in
                segment(tab)
            }
        }
        .padding(4.0)
        .background {
            Capsule()
                .fill(DFMTheme.cream.opacity(0.9))
                .overlay {
                    Capsule().strokeBorder(DFMTheme.leafGreen.opacity(0.25), lineWidth: 2.0)
                }
        }
    }

    private func segment(_ tab: NotebookTab) -> some View {
        Button {
            withAnimation(.easeInOut(duration: 0.28)) {
                selection = tab
            }
        } label: {
            Text(tab.label)
                .font(DFMTheme.title(14.0))
                .foregroundStyle(
                    selection == tab ? DFMTheme.cream : DFMTheme.inkGreen.opacity(0.55)
                )
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10.0)
                .background {
                    if selection == tab {
                        Capsule()
                            .fill(DFMTheme.leafGreen)
                            .matchedGeometryEffect(id: "dfmNotebookSegment", in: namespace)
                    }
                }
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(Text(tab.label))
    }
}

// MARK: - Screen header

/// The one page header in the app: a Comfortaa title with a Caveat annotation
/// nudged off-axis underneath it (§17.4 + §17.11). Notebook, Settings and
/// Onboarding all use this, so no screen invents its own title treatment.
struct DFMScreenHeader: View {

    let title: String
    let note: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2.0) {
            Text(title)
                .font(DFMTheme.title(30.0))
                .foregroundStyle(DFMTheme.inkGreen)
                .fixedSize(horizontal: false, vertical: true)

            Text(note)
                .font(DFMTheme.hand(21.0))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.7))
                .padding(.leading, 10.0)
                .rotationEffect(.degrees(-1.2))
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A card's own heading: one pastel accent dot from the four-accent system
/// (§17.7) against a Comfortaa label.
struct DFMSectionHeader: View {

    let title: String
    var accent: Color = DFMTheme.softGreen

    var body: some View {
        HStack(spacing: 9.0) {
            Circle()
                .fill(accent.opacity(0.6))
                .frame(width: 14.0, height: 14.0)
                .overlay {
                    Circle().strokeBorder(DFMTheme.leafGreen.opacity(0.3), lineWidth: 2.0)
                }

            Text(title)
                .font(DFMTheme.title(19.0))
                .foregroundStyle(DFMTheme.inkGreen)

            Spacer(minLength: 0.0)
        }
    }
}

// MARK: - Card

/// The one card shape in the notebook: rounded-2xl, 2px border, green shadow.
struct NotebookCard<Content: View>: View {

    private let content: Content
    private let padding: CGFloat

    init(padding: CGFloat = 16.0, @ViewBuilder content: () -> Content) {
        self.content = content()
        self.padding = padding
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(DFMTheme.cream.opacity(0.92))
            .clipShape(RoundedRectangle(cornerRadius: 22.0, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 22.0, style: .continuous)
                    .strokeBorder(DFMTheme.leafGreen.opacity(0.25), lineWidth: 2.0)
            }
            .shadow(color: DFMTheme.shadowSoft, radius: 10.0, x: 0.0, y: 4.0)
    }
}

// MARK: - Chips and pills

/// A filled pastel chip. The accent is passed in by the caller — never chosen
/// inside the component (§17.7).
struct NotebookChip: View {

    let text: String
    var accent: Color = DFMTheme.softGreen

    var body: some View {
        Text(text)
            .font(DFMTheme.title(11.0))
            .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
            .padding(.horizontal, 10.0)
            .padding(.vertical, 5.0)
            .background(Capsule().fill(accent.opacity(0.45)))
    }
}

/// An outlined pill, used for tags and for the small toggles.
struct NotebookTagPill: View {

    let text: String
    var filled: Bool = false

    var body: some View {
        Text(text)
            .font(DFMTheme.hand(17.0))
            .foregroundStyle(filled ? DFMTheme.cream : DFMTheme.inkGreen.opacity(0.7))
            .padding(.horizontal, 12.0)
            .padding(.vertical, 5.0)
            .background {
                // Both states carry the same 2px ring so the pill never changes
                // size when it is selected (§17.6).
                if filled {
                    Capsule().fill(DFMTheme.leafGreen)
                    Capsule().strokeBorder(DFMTheme.leafGreen, lineWidth: 2.0)
                } else {
                    Capsule().fill(DFMTheme.cream.opacity(0.7))
                    Capsule().strokeBorder(DFMTheme.leafGreen.opacity(0.35), lineWidth: 2.0)
                }
            }
    }
}

// MARK: - Buttons

/// The single filled action in the app: a leaf-green pill, never a rectangle
/// (§17.5), with a green-tinted shadow and the 4pt press that everything else
/// in the notebook uses.
struct DFMPrimaryButtonStyle: ButtonStyle {

    func makeBody(configuration: Configuration) -> some View {
        PrimaryLabel(configuration: configuration)
    }

    private struct PrimaryLabel: View {

        let configuration: DFMPrimaryButtonStyle.Configuration

        @Environment(\.isEnabled) private var isEnabled

        var body: some View {
            configuration.label
                .font(DFMTheme.title(17.0))
                // Disabled flips to green ink on a pale wash rather than fading
                // cream text into a pale ground, which read as broken.
                .foregroundStyle(
                    isEnabled ? DFMTheme.cream : DFMTheme.inkGreen.opacity(0.55)
                )
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15.0)
                .background {
                    Capsule().fill(
                        isEnabled ? DFMTheme.leafGreen : DFMTheme.leafGreen.opacity(0.18)
                    )
                    Capsule().strokeBorder(
                        DFMTheme.leafGreen.opacity(isEnabled ? 1.0 : 0.35),
                        lineWidth: 2.0
                    )
                }
                .shadow(
                    color: isEnabled ? DFMTheme.shadow : Color.clear,
                    radius: 12.0,
                    x: 0.0,
                    y: 5.0
                )
                .scaleEffect(configuration.isPressed ? 0.99 : 1.0)
                .offset(y: configuration.isPressed ? 2.0 : 0.0)
                .animation(.easeOut(duration: 0.18), value: configuration.isPressed)
        }
    }
}

/// The outlined twin of `DFMPrimaryButtonStyle`: same pill, same press, cream
/// fill and a 2px ring instead of a solid ground.
struct DFMSecondaryButtonStyle: ButtonStyle {

    /// Full-width by default; the compact form hugs its label (used for
    /// "Try again", where a full-width bar would shout).
    var fillsWidth: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(DFMTheme.title(16.0))
            .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
            .frame(maxWidth: fillsWidth ? .infinity : nil)
            .padding(.horizontal, fillsWidth ? 0.0 : 26.0)
            .padding(.vertical, 13.0)
            .background {
                Capsule().fill(DFMTheme.cream.opacity(0.75))
                Capsule().strokeBorder(DFMTheme.leafGreen.opacity(0.6), lineWidth: 2.0)
            }
            .shadow(color: DFMTheme.shadowSoft, radius: 8.0, x: 0.0, y: 3.0)
            .scaleEffect(configuration.isPressed ? 0.99 : 1.0)
            .offset(y: configuration.isPressed ? 2.0 : 0.0)
            .animation(.easeOut(duration: 0.18), value: configuration.isPressed)
    }
}

// MARK: - Fields

/// The one text-input surface: a lined patch of paper you write on (§17.9),
/// with the same 2px ring every other interactive element carries. Never white.
struct DFMFieldChrome: ViewModifier {

    func body(content: Content) -> some View {
        content
            .font(DFMTheme.body(15.0))
            .foregroundStyle(DFMTheme.inkGreen)
            .tint(DFMTheme.leafGreen)
            .padding(.horizontal, 14.0)
            .padding(.vertical, 13.0)
            .background {
                RoundedRectangle(cornerRadius: 16.0, style: .continuous)
                    .fill(DFMTheme.cream)
                RoundedRectangle(cornerRadius: 16.0, style: .continuous)
                    .strokeBorder(DFMTheme.leafGreen.opacity(0.3), lineWidth: 2.0)
            }
    }
}

extension View {
    /// Applies the shared text-field chrome.
    func dfmFieldChrome() -> some View {
        modifier(DFMFieldChrome())
    }
}

/// A checkbox that is a square of paper rather than a plastic iOS switch: the
/// stock `Toggle` renders a white knob on a gray track, which breaks §17.1 and
/// §17.2 on sight.
struct DFMCheckToggle: View {

    @Binding var isOn: Bool
    let label: String

    var body: some View {
        Button {
            withAnimation(.easeOut(duration: 0.18)) {
                isOn.toggle()
            }
        } label: {
            HStack(alignment: .center, spacing: 12.0) {
                ZStack {
                    RoundedRectangle(cornerRadius: 9.0, style: .continuous)
                        .fill(isOn ? DFMTheme.leafGreen : DFMTheme.cream)

                    RoundedRectangle(cornerRadius: 9.0, style: .continuous)
                        .strokeBorder(DFMTheme.leafGreen.opacity(0.55), lineWidth: 2.0)

                    if isOn {
                        Image(systemName: "checkmark")
                            .font(.system(size: 13.0, weight: .bold))
                            .foregroundStyle(DFMTheme.cream)
                    }
                }
                .frame(width: 26.0, height: 26.0)

                Text(label)
                    .font(DFMTheme.hand(18.0))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.7))
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer(minLength: 0.0)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isOn ? [.isButton, .isSelected] : .isButton)
    }
}

/// A short message on a pastel band — the app's only "notice" shape. Success
/// and failure differ by accent, never by a red/green system colour (§17.7).
struct DFMNoticeBanner: View {

    let text: String
    var accent: Color = DFMTheme.softGreen

    var body: some View {
        Text(text)
            .font(DFMTheme.hand(19.0))
            .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 14.0)
            .padding(.vertical, 11.0)
            .background {
                RoundedRectangle(cornerRadius: 16.0, style: .continuous)
                    .fill(accent.opacity(0.35))
                RoundedRectangle(cornerRadius: 16.0, style: .continuous)
                    .strokeBorder(DFMTheme.leafGreen.opacity(0.25), lineWidth: 2.0)
            }
    }
}

/// The pastel tile that heads every empty state and every onboarding row: one
/// accent, at low opacity, ringed like everything else.
struct DFMAccentTile: View {

    let symbol: String
    var accent: Color = DFMTheme.softGreen
    var size: CGFloat = 46.0

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: size * 0.42, weight: .medium))
            .foregroundStyle(DFMTheme.inkGreen.opacity(0.7))
            .frame(width: size, height: size)
            .background {
                RoundedRectangle(cornerRadius: size * 0.34, style: .continuous)
                    .fill(accent.opacity(0.45))
                RoundedRectangle(cornerRadius: size * 0.34, style: .continuous)
                    .strokeBorder(DFMTheme.leafGreen.opacity(0.22), lineWidth: 2.0)
            }
    }
}

// MARK: - Shared states

/// Loading, empty and error all share one composition — accent tile, message,
/// optional action — so switching between them never moves the page around.
struct NotebookLoadingView: View {

    var note: String = "turning the pages…"

    var body: some View {
        VStack(spacing: 16.0) {
            ProgressView()
                .tint(DFMTheme.leafGreen)
                .frame(width: 46.0, height: 46.0)

            Text(note)
                .font(DFMTheme.hand(20.0))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(.horizontal, 40.0)
        .padding(.bottom, 90.0)
    }
}

struct NotebookEmptyView: View {

    let message: String
    var symbol: String = "sparkles"
    var accent: Color = DFMTheme.softGreen

    var body: some View {
        VStack(spacing: 16.0) {
            DFMAccentTile(symbol: symbol, accent: accent)
                .rotationEffect(.degrees(-2.0))

            Text(message)
                .font(DFMTheme.hand(22.0))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.7))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .rotationEffect(.degrees(-0.8))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(.horizontal, 40.0)
        .padding(.bottom, 90.0)
    }
}

struct NotebookErrorView: View {

    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16.0) {
            DFMAccentTile(symbol: "exclamationmark.bubble", accent: DFMTheme.softPeach)
                .rotationEffect(.degrees(-2.0))

            Text(message)
                .font(DFMTheme.hand(21.0))
                .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            Button("Try again", action: retry)
                .buttonStyle(DFMSecondaryButtonStyle(fillsWidth: false))
                .padding(.top, 2.0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(.horizontal, 40.0)
        .padding(.bottom, 90.0)
    }
}

// MARK: - Formatting

/// Every string the notebook derives from a model lives here, so the wording is
/// reviewable in one place instead of scattered through four view files.
enum NotebookFormat {

    // MARK: Dates

    static func parse(_ raw: String?) -> Date? {
        guard let raw = raw else { return nil }
        return DFMDate.date(from: raw)
    }

    /// "9 Aug 2026"
    static func day(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale.current
        formatter.dateFormat = "d MMM yyyy"
        return formatter.string(from: date)
    }

    /// "9 Aug" — for rows where the year is noise.
    static func dayShort(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale.current
        formatter.dateFormat = "d MMM"
        return formatter.string(from: date)
    }

    /// "9 Aug 2026, 14:03"
    static func dayAndTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale.current
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    /// "in 3 months" / "3 months ago".
    static func relative(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    /// "opens in 3 months" / "opened 2 weeks ago".
    static func delivery(_ date: Date) -> String {
        if date > Date() {
            return "opens " + relative(date)
        }
        return "opened " + relative(date)
    }

    /// "12 minutes" — session length, rounded to something a person would say.
    static func duration(_ seconds: TimeInterval) -> String {
        let total = Int(seconds.rounded())
        if total < 60 {
            return "\(max(total, 1)) sec"
        }
        let minutes = total / 60
        return "\(minutes) min"
    }

    // MARK: Entries

    /// The four accents, applied by kind and only by kind.
    static func accent(forKind kind: String?) -> Color {
        switch (kind ?? "").lowercased() {
        case "reflection": return DFMTheme.softBlue
        case "memory": return DFMTheme.softGreen
        case "proud_moment": return DFMTheme.softYellow
        case "note": return DFMTheme.softPeach
        case "time_capsule": return DFMTheme.softBlue
        case "letter": return DFMTheme.softPeach
        default: return DFMTheme.softGreen
        }
    }

    /// "proud_moment" → "proud moment".
    static func kindLabel(_ kind: String?) -> String {
        let raw = (kind ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if raw.isEmpty { return "entry" }
        return raw.replacingOccurrences(of: "_", with: " ").lowercased()
    }

    /// The row title: the real one, or the opening words of the content.
    static func displayTitle(_ entry: DFMEntry) -> String {
        if let title = entry.title?.trimmingCharacters(in: .whitespacesAndNewlines),
           !title.isEmpty {
            return title
        }

        let body = bodyText(entry)
        guard !body.isEmpty else { return "Untitled" }

        let firstLine = body
            .components(separatedBy: .newlines)
            .first?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? body

        if firstLine.count <= 60 { return firstLine }
        return String(firstLine.prefix(60)).trimmingCharacters(in: .whitespaces) + "…"
    }

    /// Content, falling back to the raw transcript for voice-only entries.
    static func bodyText(_ entry: DFMEntry) -> String {
        if let content = entry.content?.trimmingCharacters(in: .whitespacesAndNewlines),
           !content.isEmpty {
            return content
        }
        if let transcript = entry.transcript?.trimmingCharacters(in: .whitespacesAndNewlines),
           !transcript.isEmpty {
            return transcript
        }
        return ""
    }

    /// The date a row should lead with: when it was written.
    static func writtenDate(_ entry: DFMEntry) -> Date? {
        parse(entry.entry_date) ?? parse(entry.created_at)
    }

    /// True when this entry came out of a conversation rather than a keyboard.
    static func wasSpoken(_ entry: DFMEntry) -> Bool {
        if let transcript = entry.transcript?.trimmingCharacters(in: .whitespacesAndNewlines),
           !transcript.isEmpty {
            return true
        }
        let source = (entry.source ?? "").lowercased()
        return source.contains("voice")
            || source.contains("speech")
            || source.contains("spoken")
            || source.contains("ios")
    }

    /// A stable identity for a list row. `journal_id` when the server gave us
    /// one, otherwise something derived — never a random UUID, which would make
    /// SwiftUI rebuild every row on each redraw.
    static func rowID(_ entry: DFMEntry, fallback: Int) -> String {
        if let id = entry.journal_id, !id.isEmpty { return id }
        return "row-\(fallback)-\(entry.created_at ?? "")-\(entry.title ?? "")"
    }
}

// MARK: - Preview

#Preview {
    NotebookView()
}
