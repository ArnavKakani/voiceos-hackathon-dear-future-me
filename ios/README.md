# ios/ — Dear Future Me iPhone app (Voice OS hackathon)

Loose Swift sources only. **There is no `.xcodeproj` here** — the Xcode project is
created by hand following **[IOS_RUNBOOK.md](./IOS_RUNBOOK.md)**. Start there.

Two products get built: the **app** (`DearFutureMe`) and a **widget extension**
(`DFMWidget`). They are separate binaries and share no code — the widget cannot see
app types, which is why `DFMWidget.swift` carries its own copy of the theme colours.

Getting a file into the wrong target is the #1 way to lose an hour. The rule:

| Path | App target `DearFutureMe` | Widget target `DFMWidget` |
|---|---|---|
| `DearFutureMe/*.swift` (all of them, incl. `TalkIntent.swift`) | ✅ | ❌ |
| `DFMWidget/DFMWidget.swift`, `DFMWidget/DFMWidgetBundle.swift` | ❌ | ✅ |
| `DearFutureMe/Fonts/Comfortaa.ttf`, `Caveat.ttf` | ✅ | ✅ (both, plus `UIAppFonts` in each target's Info tab) |

Deployment target is **iOS 17.0** for both. No third-party packages, ever.
