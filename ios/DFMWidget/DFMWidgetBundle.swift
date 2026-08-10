//
//  DFMWidgetBundle.swift
//  DFMWidget  ←  WIDGET EXTENSION TARGET ONLY (never the app target)
//
//  Dear Future Me — Voice OS hackathon, Phase 8.
//  The bundle is the extension's entry point. Exactly one `@main` may exist in
//  the widget target, and it lives here. If Xcode's Widget Extension template
//  left a `DFMWidgetBundle.swift` of its own behind, DELETE the template file —
//  two `@main` symbols in one target is a hard compile error.
//

import SwiftUI
import WidgetKit

@main
struct DFMWidgetBundle: WidgetBundle {
    var body: some Widget {
        DFMWidget()
    }
}
