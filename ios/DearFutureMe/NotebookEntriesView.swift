//
//  NotebookEntriesView.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  The two server-backed tabs of the notebook:
//
//    - KeptListView    — everything you asked future you to hold.
//    - LettersListView — the ones that have not arrived yet (and, on request,
//                        the ones that already did).
//    - EntryDetailView — one entry, in full, as a sheet.
//
//  All reads go through the existing `DFMAPI` methods. No new endpoints, no
//  URLSession use outside that client, and no writes: this surface can browse
//  and nothing else.
//

import SwiftUI

// MARK: - Row identity

/// A `DFMEntry` paired with a stable id, because the model itself is a plain
/// decodable struct with every field optional.
struct NotebookRow: Identifiable {
    let id: String
    let entry: DFMEntry
}

// MARK: - Kept

@MainActor
struct KeptListView: View {

    @State private var rows: [NotebookRow] = []
    @State private var isLoading = true
    @State private var errorText: String?
    @State private var selected: NotebookRow?
    @State private var hasLoadedOnce = false

    var body: some View {
        Group {
            if isLoading && rows.isEmpty {
                NotebookLoadingView(note: "looking through what you kept…")
            } else if let errorText = errorText, rows.isEmpty {
                NotebookErrorView(message: errorText) {
                    Task { await load() }
                }
            } else if rows.isEmpty {
                NotebookEmptyView(
                    message: "Nothing kept yet — go tell future you something",
                    symbol: "leaf",
                    accent: DFMTheme.softGreen
                )
            } else {
                list
            }
        }
        .task {
            guard !hasLoadedOnce else { return }
            hasLoadedOnce = true
            await load()
        }
        .sheet(item: $selected) { row in
            EntryDetailView(entry: row.entry)
        }
    }

    private var list: some View {
        ScrollView(.vertical, showsIndicators: false) {
            LazyVStack(spacing: 14.0) {
                ForEach(rows) { row in
                    Button {
                        selected = row
                    } label: {
                        EntryRowCard(entry: row.entry)
                    }
                    .buttonStyle(NotebookRowButtonStyle())
                }
            }
            .padding(.horizontal, 22.0)
            .padding(.top, 6.0)
            .padding(.bottom, 40.0)
        }
        .refreshable {
            await load()
        }
    }

    private func load() async {
        errorText = nil
        if rows.isEmpty { isLoading = true }

        do {
            let entries = try await DFMAPI().getEntries(
                kind: nil,
                from: nil,
                to: nil,
                limit: 50
            )
            var built: [NotebookRow] = []
            built.reserveCapacity(entries.count)
            for index in 0..<entries.count {
                built.append(
                    NotebookRow(
                        id: NotebookFormat.rowID(entries[index], fallback: index),
                        entry: entries[index]
                    )
                )
            }
            rows = built
        } catch {
            errorText = NotebookMessage.friendly(error)
        }

        isLoading = false
    }
}

// MARK: - Letters

@MainActor
struct LettersListView: View {

    @State private var rows: [NotebookRow] = []
    @State private var isLoading = true
    @State private var errorText: String?
    @State private var selected: NotebookRow?
    @State private var showingPast = false
    @State private var hasLoadedOnce = false

    var body: some View {
        VStack(spacing: 0.0) {
            statusToggle
                .padding(.horizontal, 24.0)
                .padding(.bottom, 10.0)

            Group {
                if isLoading && rows.isEmpty {
                    NotebookLoadingView(note: "checking the postbox…")
                } else if let errorText = errorText, rows.isEmpty {
                    NotebookErrorView(message: errorText) {
                        Task { await load() }
                    }
                } else if rows.isEmpty {
                    NotebookEmptyView(
                        message: emptyMessage,
                        symbol: "envelope",
                        accent: DFMTheme.softPeach
                    )
                } else {
                    list
                }
            }
        }
        .task {
            guard !hasLoadedOnce else { return }
            hasLoadedOnce = true
            await load()
        }
        .sheet(item: $selected) { row in
            EntryDetailView(entry: row.entry)
        }
    }

    /// Two quiet pills rather than a segmented control: this is a filter, not a
    /// second navigation layer.
    private var statusToggle: some View {
        HStack(spacing: 8.0) {
            Button {
                setPast(false)
            } label: {
                NotebookTagPill(text: "not yet opened", filled: !showingPast)
            }
            .buttonStyle(.plain)

            Button {
                setPast(true)
            } label: {
                NotebookTagPill(text: "already arrived", filled: showingPast)
            }
            .buttonStyle(.plain)

            Spacer(minLength: 0.0)
        }
    }

    private var emptyMessage: String {
        showingPast
            ? "No letters have arrived yet — the waiting is the point"
            : "No letters on their way — tap the orb and write one out loud"
    }

    private func setPast(_ past: Bool) {
        guard showingPast != past else { return }
        withAnimation(.easeInOut(duration: 0.25)) {
            showingPast = past
        }
        rows = []
        Task { await load() }
    }

    private var list: some View {
        ScrollView(.vertical, showsIndicators: false) {
            LazyVStack(spacing: 14.0) {
                ForEach(rows) { row in
                    Button {
                        selected = row
                    } label: {
                        LetterRowCard(entry: row.entry)
                    }
                    .buttonStyle(NotebookRowButtonStyle())
                }
            }
            .padding(.horizontal, 22.0)
            .padding(.top, 6.0)
            .padding(.bottom, 40.0)
        }
        .refreshable {
            await load()
        }
    }

    private func load() async {
        errorText = nil
        if rows.isEmpty { isLoading = true }

        do {
            let entries = try await DFMAPI().getLetters(
                status: showingPast ? "past" : "upcoming"
            )
            var built: [NotebookRow] = []
            built.reserveCapacity(entries.count)
            for index in 0..<entries.count {
                built.append(
                    NotebookRow(
                        id: NotebookFormat.rowID(entries[index], fallback: index),
                        entry: entries[index]
                    )
                )
            }
            rows = built
        } catch {
            errorText = NotebookMessage.friendly(error)
        }

        isLoading = false
    }
}

// MARK: - Row cards

/// A kept entry: kind chip, title, handwritten date, two lines of the body.
struct EntryRowCard: View {

    let entry: DFMEntry

    var body: some View {
        NotebookCard {
            VStack(alignment: .leading, spacing: 9.0) {
                HStack(alignment: .center, spacing: 8.0) {
                    NotebookChip(
                        text: NotebookFormat.kindLabel(entry.type),
                        accent: NotebookFormat.accent(forKind: entry.type)
                    )

                    Spacer(minLength: 6.0)

                    if let date = NotebookFormat.writtenDate(entry) {
                        Text(NotebookFormat.dayShort(date))
                            .font(DFMTheme.hand(18.0))
                            .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))
                    }
                }

                Text(NotebookFormat.displayTitle(entry))
                    .font(DFMTheme.title(16.0))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                let body = NotebookFormat.bodyText(entry)
                if !body.isEmpty {
                    Text(body)
                        .font(DFMTheme.body(14.0))
                        .foregroundStyle(DFMTheme.inkGreen.opacity(0.55))
                        .lineSpacing(3.0)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }
            }
        }
    }
}

/// A letter: the delivery date leads, because that is the whole idea.
struct LetterRowCard: View {

    let entry: DFMEntry

    var body: some View {
        NotebookCard {
            VStack(alignment: .leading, spacing: 9.0) {
                HStack(alignment: .center, spacing: 8.0) {
                    Image(systemName: "envelope")
                        .font(.system(size: 14.0, weight: .medium))
                        .foregroundStyle(DFMTheme.leafGreen.opacity(0.7))

                    if let revisit = NotebookFormat.parse(entry.revisit_at) {
                        Text(NotebookFormat.delivery(revisit))
                            .font(DFMTheme.title(14.0))
                            .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
                    } else {
                        Text("no date set")
                            .font(DFMTheme.title(14.0))
                            .foregroundStyle(DFMTheme.inkGreen.opacity(0.55))
                    }

                    Spacer(minLength: 6.0)
                }

                Text(NotebookFormat.displayTitle(entry))
                    .font(DFMTheme.hand(22.0))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                let body = NotebookFormat.bodyText(entry)
                if !body.isEmpty {
                    Text(body)
                        .font(DFMTheme.body(14.0))
                        .foregroundStyle(DFMTheme.inkGreen.opacity(0.55))
                        .lineSpacing(3.0)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }

                if let revisit = NotebookFormat.parse(entry.revisit_at) {
                    Text(NotebookFormat.day(revisit))
                        .font(DFMTheme.hand(17.0))
                        .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))
                }
            }
        }
    }
}

/// 4pt lift, 1.01 scale — the ceiling the design system sets for motion.
struct NotebookRowButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.99 : 1.0)
            .offset(y: configuration.isPressed ? 2.0 : 0.0)
            .animation(.easeOut(duration: 0.18), value: configuration.isPressed)
    }
}

// MARK: - Entry detail

@MainActor
struct EntryDetailView: View {

    let entry: DFMEntry

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            NotebookPaper()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20.0) {
                    chips
                    title
                    bodyText
                    tags
                    dates
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 26.0)
                .padding(.top, 34.0)
                .padding(.bottom, 50.0)
            }
        }
        .overlay(alignment: .topTrailing) { closeButton }
        .presentationDragIndicator(.visible)
        .preferredColorScheme(.light)
        .tint(DFMTheme.leafGreen)
    }

    private var chips: some View {
        HStack(spacing: 8.0) {
            NotebookChip(
                text: NotebookFormat.kindLabel(entry.type),
                accent: NotebookFormat.accent(forKind: entry.type)
            )

            if NotebookFormat.wasSpoken(entry) {
                NotebookChip(text: "spoken", accent: DFMTheme.softYellow)
            }

            Spacer(minLength: 0.0)
        }
        .padding(.trailing, 46.0)
    }

    private var title: some View {
        Text(NotebookFormat.displayTitle(entry))
            .font(DFMTheme.title(24.0))
            .foregroundStyle(DFMTheme.inkGreen)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var bodyText: some View {
        let text = NotebookFormat.bodyText(entry)
        if text.isEmpty {
            Text("Nothing was written down for this one.")
                .font(DFMTheme.hand(20.0))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))
        } else {
            Text(text)
                .font(DFMTheme.body(16.0))
                .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
                .lineSpacing(6.0)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private var tags: some View {
        let list = entry.tags ?? []
        if !list.isEmpty {
            VStack(alignment: .leading, spacing: 8.0) {
                Text("tagged")
                    .font(DFMTheme.hand(18.0))
                    .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))

                DFMWrapRow(items: list) { tag in
                    NotebookTagPill(text: tag)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private var dates: some View {
        VStack(alignment: .leading, spacing: 6.0) {
            if let written = NotebookFormat.writtenDate(entry) {
                dateLine(label: "written", value: NotebookFormat.day(written))
            }
            if let revisit = NotebookFormat.parse(entry.revisit_at) {
                dateLine(label: "revisit", value: NotebookFormat.delivery(revisit))
            }
            if let delivered = NotebookFormat.parse(entry.delivered_at) {
                dateLine(label: "delivered", value: NotebookFormat.day(delivered))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 4.0)
    }

    private func dateLine(label: String, value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 8.0) {
            Text(label)
                .font(DFMTheme.hand(18.0))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))
                .frame(width: 74.0, alignment: .leading)

            Text(value)
                .font(DFMTheme.body(14.0))
                .foregroundStyle(DFMTheme.inkGreen.opacity(0.7))
        }
    }

    private var closeButton: some View {
        Button {
            dismiss()
        } label: {
            Image(systemName: "xmark")
                .font(.system(size: 14.0, weight: .semibold))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.7))
                .frame(width: 38.0, height: 38.0)
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
        }
        .buttonStyle(.plain)
        .padding(.trailing, 20.0)
        .padding(.top, 18.0)
        .accessibilityLabel(Text("Close"))
    }
}

// MARK: - Small helpers

/// A left-aligned wrapping row of pills. `Grid`/`LazyVGrid` both want fixed
/// columns; tags do not have fixed widths, so this walks the items and starts a
/// new line when the running width would overflow.
struct DFMWrapRow<Item: Hashable, Content: View>: View {

    let items: [Item]
    let content: (Item) -> Content

    init(items: [Item], @ViewBuilder content: @escaping (Item) -> Content) {
        self.items = items
        self.content = content
    }

    var body: some View {
        // Three per line is plenty for tags and costs nothing to reason about.
        let lines = chunked(items, size: 3)
        VStack(alignment: .leading, spacing: 8.0) {
            ForEach(0..<lines.count, id: \.self) { index in
                HStack(spacing: 8.0) {
                    ForEach(lines[index], id: \.self) { item in
                        content(item)
                    }
                    Spacer(minLength: 0.0)
                }
            }
        }
    }

    private func chunked(_ source: [Item], size: Int) -> [[Item]] {
        guard size > 0, !source.isEmpty else { return [] }
        var result: [[Item]] = []
        var index = 0
        while index < source.count {
            let end = min(index + size, source.count)
            result.append(Array(source[index..<end]))
            index = end
        }
        return result
    }
}

/// One place that turns any thrown error into something a person can read.
enum NotebookMessage {
    static func friendly(_ error: Error) -> String {
        if let apiError = error as? DFMAPIError {
            return apiError.errorDescription ?? "That didn't work just now."
        }
        return "That didn't work just now. Give it another try."
    }
}
