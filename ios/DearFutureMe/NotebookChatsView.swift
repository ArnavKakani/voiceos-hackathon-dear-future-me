//
//  NotebookChatsView.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  The local half of the notebook: conversations you have already had.
//
//    - ChatsListView   — every stored session, newest first, swipe to delete.
//    - ChatDetailView  — the transcript, rendered the way the live screen does
//                        it: your words handwritten, the app's words typeset.
//
//  These read `ChatStore` and nothing else. Nothing here touches the network,
//  and deleting is real — the JSON file is rewritten immediately.
//

import SwiftUI

// MARK: - Chats list

@MainActor
struct ChatsListView: View {

    private let store = ChatStore.shared

    @State private var pendingDelete: ChatSession?
    @State private var showDeleteAlert = false

    var body: some View {
        Group {
            if store.sessions.isEmpty {
                NotebookEmptyView(
                    message: "No conversations saved yet — the first one starts with a tap",
                    symbol: "bubble.left.and.bubble.right",
                    accent: DFMTheme.softBlue
                )
            } else {
                list
            }
        }
        .alert(
            "Delete this conversation?",
            isPresented: $showDeleteAlert,
            presenting: pendingDelete
        ) { session in
            Button("Delete", role: .destructive) {
                store.delete(session.id)
                pendingDelete = nil
            }
            Button("Keep it", role: .cancel) {
                pendingDelete = nil
            }
        } message: { _ in
            Text("This removes it from this phone for good. Anything you asked future you to keep stays in your notebook.")
        }
    }

    private var list: some View {
        List {
            ForEach(store.sessions) { session in
                // The card *is* the row — no disclosure chevron, because nothing
                // else in this app has one.
                ChatRowButton(session: session)
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                    .listRowInsets(
                        EdgeInsets(top: 7.0, leading: 22.0, bottom: 7.0, trailing: 22.0)
                    )
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button(role: .destructive) {
                            pendingDelete = session
                            showDeleteAlert = true
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Color.clear)
        .environment(\.defaultMinListRowHeight, 10.0)
    }
}

/// A row that opens its own detail sheet. Kept as its own view so the list body
/// stays readable and so each row owns exactly one piece of state.
@MainActor
struct ChatRowButton: View {

    let session: ChatSession

    @State private var isOpen = false

    var body: some View {
        Button {
            isOpen = true
        } label: {
            ChatRowCard(session: session)
        }
        .buttonStyle(NotebookRowButtonStyle())
        .sheet(isPresented: $isOpen) {
            ChatDetailView(session: session)
        }
    }
}

struct ChatRowCard: View {

    let session: ChatSession

    var body: some View {
        NotebookCard {
            VStack(alignment: .leading, spacing: 9.0) {
                HStack(alignment: .center, spacing: 8.0) {
                    NotebookChip(text: "chat", accent: DFMTheme.softBlue)

                    Spacer(minLength: 6.0)

                    Text(NotebookFormat.dayShort(session.startedAt))
                        .font(DFMTheme.hand(18.0))
                        .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))
                }

                Text(session.firstUserLine.isEmpty ? "…" : session.firstUserLine)
                    .font(DFMTheme.hand(22.0))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                Text(subtitle)
                    .font(DFMTheme.body(13.0))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.55))
            }
        }
    }

    private var subtitle: String {
        let turns = session.turnCount
        let turnText = turns == 1 ? "1 thing you said" : "\(turns) things you said"
        if let duration = session.duration {
            return turnText + " · " + NotebookFormat.duration(duration)
        }
        return turnText
    }
}

// MARK: - Chat detail

@MainActor
struct ChatDetailView: View {

    let session: ChatSession

    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var appeared = false

    var body: some View {
        ZStack {
            NotebookPaper()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18.0) {
                    header

                    ForEach(session.messages) { line in
                        transcriptRow(line)
                    }
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
        .opacity(appeared ? 1.0 : 0.0)
        .offset(y: appeared ? 0.0 : 5.0)
        .onAppear {
            withAnimation(.easeOut(duration: reduceMotion ? 0.0 : 0.45)) {
                appeared = true
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 3.0) {
            Text(NotebookFormat.dayAndTime(session.startedAt))
                .font(DFMTheme.title(19.0))
                .foregroundStyle(DFMTheme.inkGreen)

            Text(annotation)
                .font(DFMTheme.hand(19.0))
                .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))
                .padding(.leading, 6.0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.trailing, 46.0)
        .padding(.bottom, 4.0)
    }

    private var annotation: String {
        if let duration = session.duration {
            return "you talked for " + NotebookFormat.duration(duration)
        }
        return "a conversation with future you"
    }

    /// Same contrast as the live screen: your words handwritten and pushed
    /// right, the app's words typeset and left (DESIGN_SYSTEM.md §17.4).
    private func transcriptRow(_ line: ChatLine) -> some View {
        HStack(alignment: .top, spacing: 0.0) {
            if line.isUser {
                Spacer(minLength: 44.0)
            }

            Text(line.text)
                .font(line.isUser ? DFMTheme.hand(22.0) : DFMTheme.title(15.0))
                .foregroundStyle(DFMTheme.inkGreen.opacity(line.isUser ? 0.8 : 0.7))
                .multilineTextAlignment(line.isUser ? .trailing : .leading)
                .lineSpacing(line.isUser ? 1.0 : 5.0)
                .fixedSize(horizontal: false, vertical: true)

            if !line.isUser {
                Spacer(minLength: 44.0)
            }
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
