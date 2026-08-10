//
//  Theme.swift
//  DearFutureMe
//
//  TARGET MEMBERSHIP: DearFutureMe (app target).
//
//  The single source of truth for the Dear Future Me visual language on iOS.
//  Values are lifted verbatim from the web design system (DESIGN_SYSTEM.md §17
//  "Non-negotiables" + tailwind.config.js) so the phone and the website look
//  like siblings:
//
//    1. Cream #F9F5ED everywhere — never white.
//    2. All text is green-tinted #5D8E67 / #3a5c42 — never gray or black.
//    3. All shadows are rgba(93,142,103, …) — never neutral.
//    4. Two fonts in tension: structured Comfortaa + handwritten Caveat.
//    8. Text opacity carries hierarchy (0.8 → 0.7 → 0.55 → 0.3).
//
//  FONT INSTALLATION (Xcode step, tomorrow):
//    - Drag ios/DearFutureMe/Fonts/Comfortaa.ttf and Caveat.ttf into the project
//      with "Copy items if needed" + DearFutureMe target checked.
//    - Info.plist → "Fonts provided by application" (UIAppFonts) array:
//        Comfortaa.ttf
//        Caveat.ttf
//    - The PostScript names inside those files are exactly "Comfortaa-Regular"
//      and "Caveat-Regular" (verified by parsing the name table). If the fonts
//      are not bundled, every call below silently falls back to a rounded system
//      font, so the app still builds and still looks on-brand.
//

import SwiftUI
import UIKit

/// Namespace for Dear Future Me colors and fonts.
///
/// Deliberately an `enum` with only static members so it can never be
/// instantiated and so call sites read as `DFMTheme.cream`.
enum DFMTheme {

    // MARK: - Core palette

    /// #F9F5ED — the background of everything. Never use `Color.white`.
    static let cream = Color(red: 249.0 / 255.0, green: 245.0 / 255.0, blue: 237.0 / 255.0)

    /// #3A5C42 — the darkest green; primary text.
    static let inkGreen = Color(red: 58.0 / 255.0, green: 92.0 / 255.0, blue: 66.0 / 255.0)

    /// #5D8E67 — the brand green; secondary text, borders, shadows, orb core.
    static let leafGreen = Color(red: 93.0 / 255.0, green: 142.0 / 255.0, blue: 103.0 / 255.0)

    // MARK: - Pastel accent system
    //
    // DESIGN_SYSTEM.md §17.7: the four accents are applied *by prop*, at low
    // opacity — never picked ad hoc. These four are the whole palette.

    /// #FEE188
    static let softYellow = Color(red: 254.0 / 255.0, green: 225.0 / 255.0, blue: 136.0 / 255.0)

    /// #FFD1BD
    static let softPeach = Color(red: 255.0 / 255.0, green: 209.0 / 255.0, blue: 189.0 / 255.0)

    /// #9FD89C
    static let softGreen = Color(red: 159.0 / 255.0, green: 216.0 / 255.0, blue: 156.0 / 255.0)

    /// #B7E3FF
    static let softBlue = Color(red: 183.0 / 255.0, green: 227.0 / 255.0, blue: 255.0 / 255.0)

    // MARK: - Additive helpers
    //
    // Not part of the contract other agents were given, but safe to use:
    // adding members can never break a call site that ignores them.

    /// rgba(93,142,103,0.18) — the only shadow color allowed on cream surfaces.
    static let shadow = Color(red: 93.0 / 255.0, green: 142.0 / 255.0, blue: 103.0 / 255.0)
        .opacity(0.18)

    /// A softer shadow for large, floating elements.
    static let shadowSoft = Color(red: 93.0 / 255.0, green: 142.0 / 255.0, blue: 103.0 / 255.0)
        .opacity(0.10)

    // MARK: - Fonts

    /// PostScript name of the bundled Comfortaa file, or `nil` when it is not
    /// installed in this build. Resolved once, at first use.
    private static let resolvedTitleFontName: String? = firstAvailableFontName(
        ["Comfortaa-Regular", "Comfortaa"]
    )

    /// PostScript name of the bundled Caveat file, or `nil` when it is not
    /// installed in this build. Resolved once, at first use.
    private static let resolvedHandFontName: String? = firstAvailableFontName(
        ["Caveat-Regular", "Caveat"]
    )

    /// The structured voice: Comfortaa. Falls back to semibold SF Rounded.
    ///
    /// Uses `fixedSize:` (not `size:`) so the font does **not** scale with
    /// Dynamic Type. The voice screen is a tightly composed single canvas; text
    /// growing by 200% would push the orb off-screen. Accessibility text sizes
    /// are a tomorrow item, tracked in the handoff notes.
    static func title(_ size: CGFloat) -> Font {
        if let name = resolvedTitleFontName {
            return Font.custom(name, fixedSize: size)
        }
        return Font.system(size: size, weight: .semibold, design: .rounded)
    }

    /// The handwritten voice: Caveat. Falls back to italic SF Rounded.
    static func hand(_ size: CGFloat) -> Font {
        if let name = resolvedHandFontName {
            return Font.custom(name, fixedSize: size)
        }
        return Font.system(size: size, weight: .regular, design: .rounded).italic()
    }

    /// Additive convenience: body copy. Rounded system font on purpose — the
    /// design system uses Comfortaa for headings and a neutral rounded face for
    /// long-form reading.
    static func body(_ size: CGFloat) -> Font {
        Font.system(size: size, weight: .regular, design: .rounded)
    }

    /// Returns the first name in `candidates` that UIKit can actually
    /// instantiate, or `nil` if none of them are registered.
    ///
    /// `UIFont(name:size:)` is the documented availability check: it returns
    /// `nil` for an unregistered family or PostScript name.
    private static func firstAvailableFontName(_ candidates: [String]) -> String? {
        for candidate in candidates {
            if UIFont(name: candidate, size: 12.0) != nil {
                return candidate
            }
        }
        return nil
    }
}
