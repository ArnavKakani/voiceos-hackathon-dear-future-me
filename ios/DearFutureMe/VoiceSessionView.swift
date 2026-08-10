//
//  VoiceSessionView.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  The whole app, visually: cream paper, a breathing orb, and your own words
//  appearing underneath it in handwriting.
//
//  Design rules honoured here (DESIGN_SYSTEM.md §17):
//    1.  Cream #F9F5ED ground — never white.
//    2.  Every glyph is green-tinted; nothing is gray or black.
//    3.  Shadows are green-tinted.
//    4.  Comfortaa (what the app says) in tension with Caveat (what you said).
//    7.  Only the four pastel accents, at low opacity.
//    8.  Hierarchy by opacity — 0.8 / 0.7 / 0.55 / 0.3 — not by hue.
//    9.  Notebook grid texture is on by default.
//    10. Motion is slow and small; 6–9 s ambient floats.
//
//  ANTI-PATTERN GUARD (VOICE_OS_PLAN.md §0.4 #8): no agent, tool-selection or
//  audio logic lives in this file. It reads `SessionController` and forwards
//  taps. That is all.
//

import SwiftUI

// MARK: - Transcript row model

/// A stable, identifiable slice of the transcript for `ForEach`.
///
/// Declared at file scope, not nested inside the view, so its `Identifiable`
/// conformance is never entangled with the view's `@MainActor` isolation.
private struct DFMHistoryItem: Identifiable {
    let id: Int
    let role: String
    let text: String
}

// MARK: - Orb placement

/// Where, in screen coordinates, the middle of the orb belongs.
///
/// The orb is drawn by a full-screen web view that sits *behind* the layout, so
/// it can't be positioned by the stack that owns everything else. The tap-target
/// circle in the flow publishes its own centre through this preference and the
/// web layer shifts itself to match — which keeps "what you see" and "what you
/// can tap" on top of each other on any screen size, with no magic numbers.
private struct DFMOrbCenterKey: PreferenceKey {
    static let defaultValue: CGFloat? = nil

    static func reduce(value: inout CGFloat?, nextValue: () -> CGFloat?) {
        if let next = nextValue() { value = next }
    }
}

// MARK: - VoiceSessionView

@MainActor
struct VoiceSessionView: View {

    /// A monotonically increasing counter of "start listening now" requests
    /// coming from the deep link, the widget or the App Intent. Any increase
    /// (including the very first render after a cold launch) starts a session.
    var startRequests: Int = 0

    /// What this start request was reaching for. `nil` = a plain session.
    var entryIntent: DFMEntryIntent?

    @State private var session = SessionController()
    @State private var orbCenterY: CGFloat?
    @Environment(\.scenePhase) private var scenePhase

    /// Diameter of the orb and of the circle that accepts its taps.
    /// Mirrored by `orbCameraDistance()` in WebOrb/app.js — change both together.
    private func orbSize(forWidth width: CGFloat) -> CGFloat {
        min(width * 0.57, 240.0)
    }

    var body: some View {
        ZStack {
            DFMBackground()

            // The orb renders in a FULL-SCREEN web view. The page's viewport is
            // `width=device-width, viewport-fit=cover`, so its layout viewport
            // is always the device's width and the host view's whole height —
            // only a full-screen frame can match that. A smaller frame still
            // lays out at device width, which is what cropped the orb into a
            // half-dome. Size comes from the camera distance in app.js;
            // position from the shift below.
            GeometryReader { screen in
                WebOrbView(state: session.state)
                    .frame(width: screen.size.width, height: screen.size.height)
                    .offset(y: (orbCenterY ?? screen.frame(in: .global).midY)
                            - screen.frame(in: .global).midY)
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)

            GeometryReader { proxy in
                content(orbSize: orbSize(forWidth: proxy.size.width))
                    .frame(width: proxy.size.width, height: proxy.size.height)
            }
        }
        .onPreferenceChange(DFMOrbCenterKey.self) { value in
            orbCenterY = value
        }
        .onAppear {
            // Cold launch straight from the widget: the request arrived before
            // this view existed.
            if startRequests > 0 && session.state == .idle {
                session.startSession(intent: entryIntent)
            }
        }
        .onChange(of: startRequests) { _, newValue in
            if newValue > 0 && session.state == .idle {
                session.startSession(intent: entryIntent)
            }
        }
        .onChange(of: scenePhase) { _, newPhase in
            // Never leave the microphone hot in the background.
            if newPhase == .background {
                session.endSession()
            }
        }
    }

    // MARK: Layout

    private func content(orbSize: CGFloat) -> some View {
        VStack(spacing: 0.0) {
            historyStrip
                .frame(maxHeight: 96.0)

            // Big flexible gap pushes the (now large) orb low on the screen.
            Spacer(minLength: 40.0)

            // Spacing placeholder + tap target where the orb appears (the orb
            // itself is the full-screen layer behind this VStack). Its centre is
            // published upward so that layer can line itself up with it.
            Circle()
                .fill(Color.clear)
                .contentShape(Circle())
                .frame(width: orbSize, height: orbSize)
                .background {
                    GeometryReader { proxy in
                        Color.clear.preference(
                            key: DFMOrbCenterKey.self,
                            value: proxy.frame(in: .global).midY
                        )
                    }
                }
                .onTapGesture { session.handleOrbTap() }

            // Caption tucks under the orb — far enough that the orb's soft outer
            // shell doesn't wash over the words.
            Spacer().frame(height: 16.0)

            captionView

            Spacer().frame(height: 8.0)

            currentTextView

            // Fixed (not flexible), so the top spacer absorbs all slack and the
            // orb group settles toward the bottom — raise this to lift the whole
            // orb + caption group, since only the top spacer can give.
            Spacer().frame(height: 30.0)

            footerView
        }
        .padding(.horizontal, 30.0)
        .padding(.top, 54.0)
        .padding(.bottom, 26.0)
    }

    // MARK: Conversation history (above the orb)

    /// Older turns, held at low opacity so they read as margin notes rather
    /// than as a chat log.
    private var historyStrip: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(alignment: .leading, spacing: 14.0) {
                ForEach(historyItems) { item in
                    historyRow(item)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 6.0)
        }
        .defaultScrollAnchor(.bottom)
        .mask {
            // Older turns dissolve into the paper rather than hitting a hard edge.
            LinearGradient(
                gradient: Gradient(stops: [
                    Gradient.Stop(color: Color.black.opacity(0.0), location: 0.0),
                    Gradient.Stop(color: Color.black, location: 0.35),
                    Gradient.Stop(color: Color.black, location: 1.0)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
        }
    }

    private func historyRow(_ item: DFMHistoryItem) -> some View {
        HStack(alignment: .top, spacing: 0.0) {
            if item.role == "user" {
                Spacer(minLength: 40.0)
            }

            Text(item.text)
                .font(item.role == "user" ? DFMTheme.hand(19.0) : DFMTheme.title(14.0))
                .foregroundStyle(DFMTheme.inkGreen.opacity(item.role == "user" ? 0.55 : 0.7))
                .multilineTextAlignment(item.role == "user" ? .trailing : .leading)
                .lineSpacing(item.role == "user" ? 1.0 : 4.0)
                .fixedSize(horizontal: false, vertical: true)

            if item.role != "user" {
                Spacer(minLength: 40.0)
            }
        }
    }

    // MARK: Caption + live text (below the orb)

    private var captionView: some View {
        Text(captionText)
            .font(DFMTheme.hand(22.0))
            .foregroundStyle(DFMTheme.leafGreen.opacity(0.55))
            .contentTransition(.opacity)
            .animation(.easeInOut(duration: 0.35), value: session.state)
    }

    /// The one line that matters right now: what you are saying, or what future
    /// you just said back.
    ///
    /// Bounded like live captions: the region never grows past `maxHeight`, and
    /// stays pinned to the newest words — a long thought scrolls its older
    /// lines up behind a fade instead of shoving the whole layout off-screen.
    private var currentTextView: some View {
        // Plain text, not a masked scroll view: the mask + tight frame were
        // clipping Caveat's tall glyphs (?, !, ascenders). Generous vertical
        // padding gives the script face room; long transcripts shrink to fit
        // via minimumScaleFactor rather than being cropped.
        Text(currentText)
            .font(currentUsesHandwriting ? DFMTheme.hand(29.0) : DFMTheme.title(20.0))
            .foregroundStyle(DFMTheme.inkGreen.opacity(0.8))
            .multilineTextAlignment(.center)
            .lineSpacing(currentUsesHandwriting ? 3.0 : 6.0)
            .lineLimit(4)
            .minimumScaleFactor(0.6)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.vertical, 10.0)
            .frame(maxWidth: .infinity, minHeight: 70.0, alignment: .center)
            .opacity(currentText.isEmpty ? 0.0 : 1.0)
            .contentTransition(.opacity)
            .animation(.easeInOut(duration: 0.35), value: currentText)
    }

    private var footerView: some View {
        VStack(spacing: 6.0) {
            if let error = session.lastError, session.state == .idle {
                Text(error)
                    .font(DFMTheme.body(12.0))
                    .foregroundStyle(DFMTheme.inkGreen.opacity(0.55))
                    .multilineTextAlignment(.center)
            }

            Text("Tap the orb any time. There is no wrong thing to say.")
                .font(DFMTheme.hand(16.0))
                .foregroundStyle(DFMTheme.inkGreen.opacity(0.3))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: Derived content

    /// The last few turns, minus whichever one is already on stage below the orb
    /// (so a line is never shown twice).
    private var historyItems: [DFMHistoryItem] {
        var all: [DFMHistoryItem] = []
        var index = 0
        for message in session.messages {
            all.append(DFMHistoryItem(id: index, role: message.role, text: message.text))
            index += 1
        }

        if let last = all.last, isShowingLargeCopyOfLastMessage(role: last.role) {
            all.removeLast()
        }

        let window = 6
        if all.count > window {
            return Array(all.suffix(window))
        }
        return all
    }

    /// While listening we show the *live* transcript below the orb, so the whole
    /// stored conversation belongs in the strip. In every other state the big
    /// line is a copy of the newest message.
    private func isShowingLargeCopyOfLastMessage(role: String) -> Bool {
        switch session.state {
        case .listening:
            return false
        case .thinking:
            return role == "user"
        case .speaking, .idle:
            return role == "assistant"
        }
    }

    private var captionText: String {
        switch session.state {
        case .idle:
            return "Tap to talk to future you"
        case .listening:
            return "Future you is listening"
        case .thinking:
            return "Thinking it over…"
        case .speaking:
            return "Tap to reply"
        }
    }

    private var currentText: String {
        switch session.state {
        case .idle:
            return session.lastAssistantText
        case .listening:
            return session.speech.transcript
        case .thinking:
            return session.lastUserText
        case .speaking:
            return session.lastAssistantText
        }
    }

    /// Your words are handwritten; the app's words are typeset. That contrast
    /// is the brand (DESIGN_SYSTEM.md §17.4).
    private var currentUsesHandwriting: Bool {
        switch session.state {
        case .listening, .thinking:
            return true
        case .idle, .speaking:
            return false
        }
    }
}

// MARK: - Background

/// Cream paper: four pastel washes, a notebook grid and a soft green vignette.
/// Nothing here is flat, and nothing here is white.
struct DFMBackground: View {

    @State private var drift = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        GeometryReader { proxy in
            layers(in: proxy.size)
        }
        .ignoresSafeArea()
        .onAppear {
            drift = true
        }
    }

    private func layers(in size: CGSize) -> some View {
        ZStack {
            DFMTheme.cream

            // Barely-there tints: the paper must read as cream first, colour
            // second. At full-screen scale anything stronger turns to soup.
            blob(
                color: DFMTheme.softGreen.opacity(0.16),
                diameter: size.width * 1.15,
                x: size.width * 0.10,
                y: size.height * 0.15,
                step: 0
            )
            blob(
                color: DFMTheme.softYellow.opacity(0.13),
                diameter: size.width * 0.95,
                x: size.width * 0.94,
                y: size.height * 0.07,
                step: 1
            )
            blob(
                color: DFMTheme.softPeach.opacity(0.11),
                diameter: size.width * 1.05,
                x: size.width * 0.86,
                y: size.height * 0.76,
                step: 2
            )
            blob(
                color: DFMTheme.softBlue.opacity(0.10),
                diameter: size.width * 0.80,
                x: size.width * 0.04,
                y: size.height * 0.88,
                step: 3
            )

            PaperGrid(spacing: 28.0)

            RadialGradient(
                gradient: Gradient(colors: [
                    DFMTheme.leafGreen.opacity(0.0),
                    DFMTheme.leafGreen.opacity(0.05)
                ]),
                center: .center,
                startRadius: min(size.width, size.height) * 0.35,
                endRadius: max(size.width, size.height) * 0.80
            )
        }
        .frame(width: size.width, height: size.height)
        .allowsHitTesting(false)
    }

    /// One soft wash of colour, drifting on a 6–9 s cycle (§17.10).
    private func blob(color: Color,
                      diameter: CGFloat,
                      x: CGFloat,
                      y: CGFloat,
                      step: Int) -> some View {
        let amplitude: CGFloat = reduceMotion ? 0.0 : 9.0
        let duration: Double = 6.0 + Double(step)

        return Circle()
            .fill(color)
            .frame(width: diameter, height: diameter)
            .blur(radius: 70.0)
            .position(x: x, y: y)
            .offset(y: drift ? -amplitude : amplitude)
            .animation(
                .easeInOut(duration: duration).repeatForever(autoreverses: true),
                value: drift
            )
    }
}

// MARK: - Paper grid

/// The notebook texture from the website (`.bg-grid`): 28pt squares drawn in
/// rgba(93,142,103,0.07). Drawn with `Canvas` so it costs one static layer.
struct PaperGrid: View {

    var spacing: CGFloat = 28.0

    var body: some View {
        Canvas { context, size in
            var path = Path()

            var x: CGFloat = 0.0
            while x <= size.width {
                path.move(to: CGPoint(x: x, y: 0.0))
                path.addLine(to: CGPoint(x: x, y: size.height))
                x += spacing
            }

            var y: CGFloat = 0.0
            while y <= size.height {
                path.move(to: CGPoint(x: 0.0, y: y))
                path.addLine(to: CGPoint(x: size.width, y: y))
                y += spacing
            }

            context.stroke(
                path,
                with: .color(DFMTheme.leafGreen.opacity(0.07)),
                lineWidth: 1.0
            )
        }
        .allowsHitTesting(false)
    }
}

// MARK: - Preview

#Preview {
    VoiceSessionView()
}
