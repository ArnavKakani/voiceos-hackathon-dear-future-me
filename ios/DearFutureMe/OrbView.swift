//
//  OrbView.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  The breathing voice orb — the thing people look at for the whole demo.
//
//  Motion follows DESIGN_SYSTEM.md §17.10: "slow and small — 4–6px lifts, 1.02
//  scales, 6–9s ambient floats". Nothing here bounces, spins fast, or flashes.
//  Each state gets a different *quality* of movement rather than a different
//  amount of it:
//
//      idle      a 9 s float, barely-there breath — asleep but alive
//      listening a slow 3.6 s pulse ring opening outward — leaning in
//      thinking  a tight shimmer arc tracing the rim — working, not waiting
//      speaking  three ripple rings on a 2.6 s cycle — the voice made visible
//
//  Everything is driven by `TimelineView(.animation)` + sine functions rather
//  than by SwiftUI animations, so the states cross-fade continuously and no
//  animation can ever get "stuck" mid-transition.
//

import SwiftUI
import Foundation

// MARK: - Animation values

/// One ripple/pulse ring around the orb.
struct OrbRing: Identifiable {
    let id: Int
    let scale: Double
    let opacity: Double
}

/// Every animated quantity of the orb for a single frame.
///
/// Computed as plain arithmetic in one place so the SwiftUI body stays small
/// and fast to type-check.
struct OrbValues {
    var breathScale: Double
    var floatOffset: Double
    var glowOpacity: Double
    var innerScale: Double
    var innerOpacity: Double
    var shimmerAngle: Double
    var shimmerOpacity: Double
    var rings: [OrbRing]

    /// Builds a frame of animation for `state` at absolute time `time`.
    static func make(state: SessionState, time: Double) -> OrbValues {
        let breathPeriod: Double
        let breathAmount: Double
        let floatAmount: Double
        let glowBase: Double

        switch state {
        case .idle:
            breathPeriod = 9.0
            breathAmount = 0.012
            floatAmount = 5.0
            glowBase = 0.16
        case .listening:
            breathPeriod = 7.0
            breathAmount = 0.020
            floatAmount = 4.0
            glowBase = 0.26
        case .thinking:
            breathPeriod = 6.0
            breathAmount = 0.008
            floatAmount = 2.0
            glowBase = 0.22
        case .speaking:
            breathPeriod = 5.0
            breathAmount = 0.022
            floatAmount = 3.0
            glowBase = 0.30
        }

        let breathScale: Double = 1.0 + breathAmount * wave(time, period: breathPeriod)
        let floatOffset: Double = -floatAmount * wave(time, period: 9.0)
        let glowOpacity: Double = glowBase + 0.05 * wave(time, period: breathPeriod)
        let innerScale: Double = 0.72 + 0.015 * wave(time, period: breathPeriod * 0.8)

        let shimmerAngle: Double
        let shimmerOpacity: Double
        switch state {
        case .thinking:
            shimmerAngle = time * 150.0
            shimmerOpacity = 0.50 + 0.18 * wave(time, period: 1.1)
        default:
            // Invisible at rest — a stray arc reads as a gloss artifact.
            shimmerAngle = time * 14.0
            shimmerOpacity = 0.0
        }

        var rings: [OrbRing] = []
        switch state {
        case .speaking:
            for index in 0..<3 {
                let progress = phase(time, period: 2.6, offset: Double(index) / 3.0)
                rings.append(
                    OrbRing(
                        id: index,
                        scale: 1.0 + 0.42 * progress,
                        opacity: (1.0 - progress) * 0.32
                    )
                )
            }
        case .listening:
            for index in 0..<3 {
                if index == 0 {
                    let progress = phase(time, period: 3.6, offset: 0.0)
                    rings.append(
                        OrbRing(
                            id: index,
                            scale: 1.0 + 0.26 * progress,
                            opacity: (1.0 - progress) * 0.22
                        )
                    )
                } else {
                    rings.append(OrbRing(id: index, scale: 1.0, opacity: 0.0))
                }
            }
        case .idle, .thinking:
            for index in 0..<3 {
                rings.append(OrbRing(id: index, scale: 1.0, opacity: 0.0))
            }
        }

        return OrbValues(
            breathScale: breathScale,
            floatOffset: floatOffset,
            glowOpacity: glowOpacity,
            innerScale: innerScale,
            innerOpacity: 0.18,
            shimmerAngle: shimmerAngle,
            shimmerOpacity: shimmerOpacity,
            rings: rings
        )
    }

    /// A sine wave in the range −1…1 with the given period in seconds.
    private static func wave(_ time: Double, period: Double) -> Double {
        sin(time * 2.0 * Double.pi / period)
    }

    /// A 0…1 sawtooth: how far through the current cycle we are.
    private static func phase(_ time: Double, period: Double, offset: Double) -> Double {
        let raw = time / period + offset
        return raw - raw.rounded(.down)
    }
}

// MARK: - OrbView

/// The voice orb. Purely presentational: it takes a state and draws it.
struct OrbView: View {

    /// The conversation phase to render.
    var state: SessionState

    /// Diameter of the orb core, in points.
    var size: CGFloat = 216.0

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if reduceMotion {
                // Still beautiful, just held at rest.
                orbBody(OrbValues.make(state: state, time: 0.0))
            } else {
                TimelineView(.animation) { context in
                    let time = context.date.timeIntervalSinceReferenceDate
                    orbBody(OrbValues.make(state: state, time: time))
                }
            }
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(accessibilityLabelText))
        .accessibilityAddTraits(.isButton)
    }

    // MARK: Layers

    private func orbBody(_ values: OrbValues) -> some View {
        ZStack {
            glowLayer(values)
            ringsLayer(values)
            coreLayer
            innerLayer(values)
            highlightLayer
            shimmerLayer(values)
        }
        .frame(width: size, height: size)
        .scaleEffect(values.breathScale)
        .offset(y: values.floatOffset)
    }

    /// The soft halo of light the orb sits in.
    private func glowLayer(_ values: OrbValues) -> some View {
        Circle()
            .fill(
                RadialGradient(
                    gradient: Gradient(colors: [
                        DFMTheme.softGreen,
                        DFMTheme.leafGreen.opacity(0.0)
                    ]),
                    center: .center,
                    startRadius: size * 0.18,
                    endRadius: size * 0.80
                )
            )
            .frame(width: size * 1.7, height: size * 1.7)
            .blur(radius: 26.0)
            .opacity(values.glowOpacity)
    }

    /// Pulse (listening) and ripple (speaking) rings.
    private func ringsLayer(_ values: OrbValues) -> some View {
        ZStack {
            ForEach(values.rings) { ring in
                Circle()
                    .stroke(DFMTheme.leafGreen.opacity(ring.opacity), lineWidth: 1.5)
                    .frame(width: size, height: size)
                    .scaleEffect(ring.scale)
            }
        }
    }

    /// The orb itself: a soft green sphere with a 2px cream rim
    /// (DESIGN_SYSTEM.md §17.6 — 2px borders on interactive elements).
    private var coreLayer: some View {
        // Flat-luminous, not spherical: a nearly-centered gradient with a low
        // contrast range, so the orb reads as a soft light behind paper rather
        // than a glossy 3D ball. The dark ink-green edge stop was what made it
        // look like a bowling ball.
        Circle()
            .fill(
                RadialGradient(
                    gradient: Gradient(stops: [
                        Gradient.Stop(color: DFMTheme.softGreen.opacity(0.9), location: 0.0),
                        Gradient.Stop(color: DFMTheme.leafGreen.opacity(0.85), location: 0.78),
                        Gradient.Stop(color: DFMTheme.leafGreen, location: 1.0)
                    ]),
                    center: UnitPoint(x: 0.5, y: 0.42),
                    startRadius: 0.0,
                    endRadius: size * 0.62
                )
            )
            .overlay {
                Circle().strokeBorder(DFMTheme.cream.opacity(0.5), lineWidth: 2.0)
            }
            .frame(width: size, height: size)
            .shadow(color: DFMTheme.shadow.opacity(0.6), radius: 30.0, x: 0.0, y: 14.0)
    }

    /// A second, smaller sphere inside — gives the orb depth and a second,
    /// slightly out-of-phase breath.
    private func innerLayer(_ values: OrbValues) -> some View {
        Circle()
            .fill(DFMTheme.cream.opacity(values.innerOpacity))
            .frame(width: size, height: size)
            .scaleEffect(values.innerScale)
            .blur(radius: 12.0)
    }

    /// A whisper of top light. Cream rather than white — nothing in this brand
    /// is ever pure white (§17.1). Broad and faint on purpose: a concentrated
    /// bright spot reads as specular gloss, which is exactly the wrong material.
    private var highlightLayer: some View {
        Circle()
            .fill(
                RadialGradient(
                    gradient: Gradient(colors: [
                        DFMTheme.cream.opacity(0.16),
                        DFMTheme.cream.opacity(0.0)
                    ]),
                    center: UnitPoint(x: 0.5, y: 0.18),
                    startRadius: 0.0,
                    endRadius: size * 0.75
                )
            )
            .frame(width: size, height: size)
            .allowsHitTesting(false)
    }

    /// A short arc tracing the rim: the "thinking" tell.
    private func shimmerLayer(_ values: OrbValues) -> some View {
        Circle()
            .trim(from: 0.0, to: 0.18)
            .stroke(
                DFMTheme.cream.opacity(values.shimmerOpacity),
                style: StrokeStyle(lineWidth: 3.0, lineCap: .round)
            )
            .frame(width: size * 0.84, height: size * 0.84)
            .rotationEffect(.degrees(values.shimmerAngle))
            .allowsHitTesting(false)
    }

    // MARK: Accessibility

    private var accessibilityLabelText: String {
        switch state {
        case .idle:
            return "Start talking to future you"
        case .listening:
            return "Listening. Double tap to stop."
        case .thinking:
            return "Thinking. Double tap to stop."
        case .speaking:
            return "Future you is speaking. Double tap to reply."
        }
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        DFMTheme.cream.ignoresSafeArea()
        VStack(spacing: 40.0) {
            OrbView(state: .listening, size: 160.0)
            OrbView(state: .speaking, size: 160.0)
        }
    }
}
