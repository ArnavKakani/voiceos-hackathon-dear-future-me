# iOS Assembly Runbook — Dear Future Me (Voice OS hackathon)

**Read this top to bottom. Do not skip ahead.** It assumes you have never opened Xcode.
Every click is written out. Where a menu name may differ slightly by Xcode version,
both wordings are given.

There is **no `.xcodeproj` in this repo**. The Swift files were written overnight
without a compiler. Your job this morning is to create the project by hand, drop the
files into the right targets, and run it on a real iPhone. Budget **45–60 minutes**
to the first successful device run.

**What you need before you start**

- A Mac with Xcode. (Already done — Xcode 26.6 is installed on this machine; see §1.)
- An Apple ID (a free one is fine — no paid Developer Program needed).
- An iPhone running iOS 17 or later, plus a USB-C/Lightning cable.
- Two API keys, pasted in at the end: an Anthropic key (`sk-ant-…`) and a DFM key
  (`dfm_live_…`, minted on the website's `/developer` page while signed in).

**The single most common mistake with this project** is putting a file in the wrong
target. `ios/DearFutureMe/*.swift` goes in the **app** target. `ios/DFMWidget/*.swift`
goes in the **widget** target. Never both. The table in `ios/README.md` is the
authority; §3 and §6 below walk it through.

---

## 0. Overnight status — the backend is LIVE (read before §1)

Verified against production at the end of the overnight run:

- **The API is deployed and all gates pass**: `https://dear-future-me-phi.vercel.app`
  — and the custom domain **`https://dearfutureme.neurohealthalliance.org` routes
  `/v1` too** (checked: `/v1/openapi.json` → 200). The app's built-in default base
  URL is the custom domain, so **§8 step 4 needs no change — leave the base URL
  as-is.** Details of what was deployed: `MORNING_RUNBOOK.md` at the repo root.
- **Response shapes were confirmed against the deployed backend source** — list
  endpoints return bare JSON arrays, `/v1/timeline` returns `[{date, entries[]}]`,
  and `/v1/me` returns `{id, name, email, created_at}`. The Swift client
  (`DFMAPI.swift`) was aligned to this overnight; the "guessed envelope" warnings
  in §12 are retired.
- **Xcode 26.6 is installed but the license is not accepted.** Before anything in
  §1: run `sudo xcodebuild -license accept` in Terminal (needs your password), or
  just launch Xcode and accept the dialog.

**Getting a DFM API key this morning — three options, in order of preference:**

1. **The `/developer` page** (the §8 instructions assume this). It was built
   overnight but the *deployed* site predates it — someone must redeploy first:
   on the backend Mac (which is `vercel login`'d and linked), pull this branch and
   run `vercel --prod`. Then sign in on the site → `/developer` → create key.
2. **Copy a test key from the backend Mac's keychain** (they are NOT on this Mac):
   `security find-generic-password -w -s dfm-overnight-test-key-a` on that machine
   (test user A: `5465b13c-3efc-4e14-8d4c-da17ff1f63bd`). Fine for wiring/testing;
   mint a personal key for the actual demo account before rehearsing.
3. **Mint directly** on the backend Mac: `integrations/mint_test_key.py`
   (documented in `MORNING_RUNBOOK.md`; needs the Supabase secret that Mac holds).

**Seed the demo account before rehearsing (§9's demo needs history).** Moments 3–5
("Have I ever felt like this before?" → playback → then-vs-now) search past entries;
a fresh account returns nothing. With the demo account's key, insert 2–3 backdated
entries, e.g.:

```bash
curl -X POST "$DFM_API_URL/v1/entries" -H "x-api-key: $KEY" -H "content-type: application/json" \
  -d '{"kind":"reflection","title":"Starting the thing","content":"I keep putting off starting the project. I am scared it will not be good enough.","tags":["self-doubt","beginnings"]}'
```

(One "unsure/scared to start" reflection + one small proud moment gives the agent
real material for the §9 payoff line.)

---

## 1. Xcode first launch

> **Good news, checked last night:** **Xcode 26.6 is already installed** at
> `/Applications/Xcode.app` and the **iOS platform support is already downloaded**.
> The only thing outstanding is the licence agreement, which needs your password.
> So this section is minutes, not the 40–60 the plan budgeted.

1. Open **Xcode** (Applications, or Spotlight with ⌘-Space and type "Xcode").
2. The first launch shows a licence agreement. Click **Agree**, then enter your Mac
   password when asked.
   *Faster alternative:* in Terminal run `sudo xcodebuild -license accept`, enter your
   password, then open Xcode.
3. If Xcode says **"Installing components…"**, let it finish. It should be quick — the
   iOS platform is already present.
4. When it lands you see the **Welcome to Xcode** window. Leave it open.

*(Menu paths below were written for Xcode 26. Older-version wordings are given in
parentheses where they differ.)*

### 1a. Add your Apple ID now (you will need it in §7)

1. Menu bar: **Xcode > Settings…** (older versions: **Xcode > Preferences…**), or ⌘-,
2. Click the **Accounts** tab.
3. Click **+** at the bottom-left → **Apple ID** → **Continue**.
4. Sign in. After it succeeds, the right pane lists a team named
   **"<Your Name> (Personal Team)"**. That is the free signing team. Good.
5. Close Settings.

---

## 2. Create the project

1. Welcome window: **Create New Project…**
   (or menu bar **File > New > Project…**, ⇧⌘N)
2. Platform selector at the top: **iOS**. In the **Application** row pick **App**.
   Click **Next**.
3. Fill the form exactly:
   - **Product Name:** `DearFutureMe`  ← no space, exact capitalisation
   - **Team:** your Personal Team (if the menu is empty, redo §1a)
   - **Organization Identifier:** `com.neurohealth`
   - **Bundle Identifier:** shown greyed-out below; Xcode derives it from the product
     name, so it will read `com.neurohealth.DearFutureMe` with capitals. That is
     fine for now — §2c corrects it to all-lowercase **before anything is built for a
     device**, so no App ID slot is wasted on the capitalised version.
   - **Interface:** **SwiftUI**
   - **Language:** **Swift**
   - **Testing System:** **None** (older Xcode: leave "Include Tests" unchecked)
   - **Storage / Use Core Data:** **None** / unchecked
4. Click **Next**. Choose a save location — **your Documents folder is fine and is
   the safer choice**. Do **not** save it inside this git repo unless you intend to
   commit the project file. **Uncheck "Create Git repository on my Mac"**.
   Click **Create**.
5. Xcode opens the project. The left sidebar (**Project Navigator**, ⌘-1) shows a
   yellow `DearFutureMe` folder containing `DearFutureMeApp.swift`,
   `ContentView.swift`, `Assets.xcassets`, and a blue project icon at the very top.

### 2a. Delete the template files that we replace

1. In the Project Navigator, click **`ContentView.swift`** once to select it.
2. Press **Delete** (or right-click → **Delete**).
3. A dialog appears — click **Move to Trash** (not "Remove Reference").
4. Do the same for **`DearFutureMeApp.swift`**. Our repo has its own version with the
   deep-link handling and the `dfmStartListening` notification in it.

The project will not build right now. That is expected until §3 is done.

### 2b. Set the deployment target

1. Click the blue **DearFutureMe** project icon at the top of the Project Navigator.
2. In the editor, under **TARGETS**, select **DearFutureMe**.
3. Open the **General** tab. Under **Minimum Deployments**, set **iOS** to **17.0**.
   (The widget uses `containerBackground(for:)`, which requires 17.)

### 2c. Fix the bundle identifier now, once

Do this before any build touches a real device — every distinct bundle id you build
for a device permanently consumes one of a free account's 10 App IDs per week.

1. Same screen, **TARGETS > DearFutureMe** → **Signing & Capabilities** tab.
2. ✅ **Automatically manage signing**, **Team:** your **Personal Team**.
3. **Bundle Identifier:** replace it with **`com.neurohealth.dearfutureme`** — all
   lowercase. Type it once, carefully. §7a verifies it; do not keep editing it.

---

## 3. Add the app source files

You are copying files **out of this repo** into the Xcode project.

1. Menu bar: **File > Add Files to "DearFutureMe"…** (⌥⌘A).
2. In the file chooser, navigate to this repo's **`ios/DearFutureMe/`** folder.
   Tip: press ⇧⌘G and paste the full path to jump straight there.
3. Select **every `.swift` file** in that folder (click the first, then ⇧-click or
   ⌘-click the rest). Do **not** select the `Fonts` folder yet — that is §4.
4. **Before clicking Add, check the bottom half of the dialog:**
   - **Destination:** ✅ **Copy items if needed** — tick this. It copies the files
     into your project folder so the project is self-contained.
   - **Added folders:** **Create groups** (not "Create folder references").
   - **Add to targets:** a list of checkboxes. ✅ **DearFutureMe** must be ticked.
     Nothing else exists yet, so that is the only box.
5. Click **Add**.

> **What "target membership" means, once:** a target is one built product — the app
> is one, the widget is another. A file is compiled into a target only if that
> target's checkbox is ticked for it. Tick the wrong box and you get either
> "cannot find X in scope" (file missing from the target that needs it) or
> "invalid redeclaration" / "multiple @main" (file in a target that shouldn't have it).

**To check or fix a file's membership later:** select the file in the Project
Navigator, then open the **File Inspector** on the right (⌥⌘1). The **Target
Membership** box lists every target with a checkbox.

**Files that must be in the app target** (the list as of last night — add every
`.swift` file present in `ios/DearFutureMe/`, the overnight sessions may have added
more):

| File | App target | Widget target | What it is |
|---|---|---|---|
| `DearFutureMeApp.swift` | ✅ | ❌ | app entry point, `.onOpenURL`, notification declaration |
| `VoiceSessionView.swift` | ✅ | ❌ | the orb screen |
| `SettingsView.swift` | ✅ | ❌ | the gear sheet (§8) |
| `SessionController.swift` | ✅ | ❌ | session state machine |
| `SpeechRecognizer.swift` | ✅ | ❌ | speech in |
| `Speaker.swift` | ✅ | ❌ | speech out |
| `Theme.swift` | ✅ | ❌ | `DFMTheme` |
| `AgentLoop.swift` | ✅ | ❌ | tool-calling loop |
| `ClaudeClient.swift` | ✅ | ❌ | Anthropic Messages API |
| `DFMTools.swift` | ✅ | ❌ | tool schemas + executors |
| `DFMAPI.swift` | ✅ | ❌ | DFM `/v1` client |
| `DFMConfig.swift` | ✅ | ❌ | keys + base URL |
| `TalkIntent.swift` | ✅ | ❌ | Siri / Action Button |

Now build once. First set the toolbar destination (right of the ▶ button) to any
**iPhone Simulator** — a simulator build needs no provisioning, so it cannot burn an
App ID while you are still shaking out compile errors. Then **Product > Build** (⌘B).

Fix any "cannot find … in scope" error by checking that the named file was actually
added. It should build clean before you move on.

---

## 4. Fonts

Two fonts carry the brand and both targets need them (DESIGN_SYSTEM.md §17 #4:
Comfortaa and Caveat together, never one alone).

1. **File > Add Files to "DearFutureMe"…** again.
2. Navigate to `ios/DearFutureMe/Fonts/` and select **`Comfortaa.ttf`** and
   **`Caveat.ttf`**.
3. ✅ **Copy items if needed**, **Create groups**, and tick **DearFutureMe** under
   *Add to targets*. Click **Add**.
   *(The widget target does not exist yet. §6a comes back and ticks it.)*
4. Register them with the app. Click the blue project icon → **TARGETS >
   DearFutureMe** → **Info** tab.
5. Hover any existing row, click the small **+** that appears.
6. In the new row's **Key** field, start typing `Fonts provided by application` and
   pick it from the autocomplete. (Its raw name is `UIAppFonts`; if your Xcode shows
   raw keys, type that.) Its **Type** becomes **Array**.
7. Click the ▸ triangle next to the key to expand it, then click **+** on the key row
   to add **Item 0**. Set its **Value** to exactly `Comfortaa.ttf`.
8. Add **Item 1** the same way with value `Caveat.ttf`.
   Filenames are case-sensitive and include the extension.

**Verifying the fonts actually registered** (do this after the first run in §9):
if text looks like plain system rounded rather than handwritten, the fallback in
`Theme.swift` / `WidgetTheme` kicked in. The registered PostScript names for these
files are **`Caveat-Regular`** and **`Comfortaa-Regular`** (family names `Caveat`
and `Comfortaa`); both are already in the lookup lists, so a fallback means the
files are missing from that target's *Copy Bundle Resources* build phase or absent
from its `UIAppFonts` array — not a naming problem.

---

## 5. Info entries: permissions and the URL scheme

Still in **TARGETS > DearFutureMe > Info**.

### 5a. Microphone and speech permission strings

iOS kills the app on the spot if it asks for the mic without a usage string. Add two
rows exactly as in §4 steps 5–6:

| Key (friendly name) | Raw key | Type | Value (this text is shown to the user — type it exactly) |
|---|---|---|---|
| Privacy - Microphone Usage Description | `NSMicrophoneUsageDescription` | String | `Dear Future Me listens so you can speak your reflections instead of typing them.` |
| Privacy - Speech Recognition Usage Description | `NSSpeechRecognitionUsageDescription` | String | `Your speech is turned into text so Future You can save and search what you said.` |

### 5b. URL scheme (`dearfutureme://talk`)

This is what makes the widget and Safari able to open the app.

1. Open the **Info** tab of the app target (same place).
2. Scroll to **URL Types** near the bottom. If it is not visible, add a row with the
   key `URL types` (raw `CFBundleURLTypes`, an Array of Dictionaries) — but on modern
   Xcode the **URL Types** section is already there with a **+** button.
3. Click **+**. Fill in:
   - **Identifier:** `com.neurohealth.dearfutureme`
   - **URL Schemes:** `dearfutureme`   ← just the word, no `://`
   - **Role:** **Editor**
4. Nothing else. `talk` is the host, handled in code by `.onOpenURL`.

---

## 6. Add the widget extension

1. Menu bar: **File > New > Target…**
2. Platform **iOS**, scroll to the **Application Extension** section, pick
   **Widget Extension**. Click **Next**.
3. Fill in:
   - **Product Name:** `DFMWidget`   ← exact
   - **Team:** your Personal Team
   - ❌ **UNCHECK "Include Configuration App Intent"** (older wording: "Include
     Configuration Intent"). This is important: leaving it checked generates an
     `AppIntent`-based configuration that clashes with our `StaticConfiguration`.
   - ❌ **Include Live Activity** — unchecked.
4. Click **Finish**. A dialog asks **"Activate 'DFMWidget' scheme?"** — click
   **Activate**. (If you clicked Cancel, no harm: §9 step 8 shows how to switch
   schemes from the toolbar.)
5. In the Project Navigator a new yellow **DFMWidget** folder appears. **Delete its
   template Swift files** — typically `DFMWidget.swift` and possibly
   `DFMWidgetBundle.swift` / `AppIntent.swift`. Select them → **Delete** → **Move to
   Trash**. Keep `Assets.xcassets` and `Info.plist` if present.
   *(Leaving the template `DFMWidget.swift` in place causes "invalid redeclaration of
   DFMWidget"; leaving its bundle file causes "'main' attribute can only apply to one
   type".)*
6. **File > Add Files to "DearFutureMe"…**, navigate to this repo's **`ios/DFMWidget/`**,
   select **`DFMWidget.swift`** and **`DFMWidgetBundle.swift`**.
   In the options at the bottom: ✅ Copy items if needed, Create groups, and under
   *Add to targets* tick **DFMWidget** and **UNTICK DearFutureMe**.
   Click **Add**.

   > If you tick both, the build fails with duplicate `@main` / duplicate type errors.
   > If you tick neither, the widget compiles to an empty extension and never appears
   > in the widget gallery.

### 6a. Fonts for the widget

The widget is a separate binary with its own bundle. It does not inherit the app's
fonts.

1. Select **`Comfortaa.ttf`** in the Project Navigator. Open the **File Inspector**
   (⌥⌘1) on the right. Under **Target Membership**, tick **DFMWidget** as well
   (leave DearFutureMe ticked).
2. Same for **`Caveat.ttf`**.
3. Click the blue project icon → **TARGETS > DFMWidget** → **Info** tab.
4. Add the `Fonts provided by application` (`UIAppFonts`) array here too, with
   `Comfortaa.ttf` and `Caveat.ttf` — exactly as in §4 steps 5–8.

### 6b. Deployment target for the widget

**TARGETS > DFMWidget > General > Minimum Deployments > iOS: 17.0.**

Build again (⌘B). Both targets should compile.

---

## 7. Signing both targets, and the iPhone

### 7a. Signing

Do this for **both** targets.

1. Blue project icon → **TARGETS > DearFutureMe** → **Signing & Capabilities** tab.
2. Confirm what §2c already set: ✅ **Automatically manage signing**,
   **Team:** your **Personal Team**, **Bundle Identifier:**
   **`com.neurohealth.dearfutureme`** (all lowercase).
3. Wait a few seconds. The **Signing Certificate** line should fill in with
   "Apple Development: your@email". No red text = good.
4. Now **TARGETS > DFMWidget** → **Signing & Capabilities**:
   - ✅ Automatically manage signing, same **Personal Team**
   - **Bundle Identifier:** **`com.neurohealth.dearfutureme.DFMWidget`**

   > The widget's bundle id **must** be the app's id plus one more dot-segment.
   > Anything else and iOS refuses to install the pair.

> ### ⚠️ Free Apple ID limits — read before you experiment
>
> - **Provisioning profiles expire after 7 days.** The app stops launching on the
>   phone about a week from now. Fix = plug in and hit ▶ again. Do not panic on
>   demo day; just rebuild that morning.
> - **10 App IDs per 7-day rolling window.** Every unique bundle identifier you
>   build burns one. You have two (`…dearfutureme` and `…dearfutureme.DFMWidget`).
>   **Do not go typo-fixing bundle ids** — each typo permanently costs a slot until
>   the window rolls, and running out blocks the demo with no workaround.
> - **3 devices** per Apple ID.
> - No App Groups, no push, no background modes on a free account. This build needs
>   none of them (a launcher widget deep-links; it does not share storage).

### 7b. The iPhone

1. Connect the iPhone by cable. On the phone, tap **Trust This Computer** and enter
   the passcode.
2. **Enable Developer Mode** (required on iOS 16+):
   - On the phone: **Settings > Privacy & Security**, scroll to the very bottom →
     **Developer Mode** → toggle **On** → **Restart**.
   - After the restart, unlock the phone; a prompt asks to turn Developer Mode on →
     **Turn On** → enter passcode.
   - *If "Developer Mode" is not in that list:* it only appears once a development
     device has been connected to Xcode at least once. Do step 1, leave the phone
     plugged in, and look again.
3. In Xcode's toolbar, the **scheme/destination** control sits next to the ▶ button.
   Set the scheme (left half) to **DearFutureMe** and the destination (right half)
   to your iPhone by name.
4. Press **▶ (Run)**, ⌘R. First build takes a few minutes.
5. The run will end with **"Could not launch … the application may need to be
   trusted"** or similar. That is normal for a free account. On the phone:
   **Settings > General > VPN & Device Management** → under *Developer App* tap your
   Apple ID → **Trust "…"** → **Trust**.
6. Press ▶ in Xcode again. The app launches.

---

## 8. First-run configuration

On the phone, in the app:

1. Tap the **settings gear** (top corner of the voice screen).
2. **DFM API key:** on your Mac, sign in to the Dear Future Me website and open
   **`/developer`**. Create a key, copy it while it is shown (`dfm_live_…` — it is
   shown **once** and never again; if you lose it, revoke and mint another).
   AirDrop or message it to the phone and paste it in.
3. **Claude API key:** from the Anthropic console (`sk-ant-…`). Paste it in.
4. **API base URL:** leave as-is unless the backend session's `MORNING_RUNBOOK.md`
   lists a different production URL — then paste that.
5. Tap **Test connection** (or equivalent). You want a success state. A 401 means the
   DFM key is wrong or revoked; a 404 means the base URL is wrong.
6. Close settings.

> Never paste either key into a chat, screenshot, or the demo recording. They are in
> `UserDefaults`, in the clear — that is a known demo-only shortcut on tomorrow's
> review list.

---

## 9. On-device test script (10 steps)

Run these in order. Steps 1–3 must be done on the **real phone** — the simulator has
no usable microphone.

**1. Permissions.** Launch the app and tap the orb. Two system alerts appear:
microphone, then speech recognition. Allow both. (If neither appears and nothing
happens, see Troubleshooting.)

**2. Live transcription.** Say "testing one two three". The words appear on screen
while you are still speaking. If they only appear at the end, partial results are off
— note it, it is cosmetic.

**3. Speech out.** Let the agent reply. You should **hear** it through the speaker,
not the earpiece. Silence here is the classic audio-session bug — see Troubleshooting.

**4. Interruption.** While the agent is talking, start speaking. It should stop
immediately and listen.

**5. Deep link.** Open **Safari** on the phone, type `dearfutureme://talk` into the
address bar, press Go, then **Open** at the prompt. The app must come to the front
**already listening** — not on a menu.

**6. Airplane mode.** Turn Airplane Mode on, ask the agent anything. You should hear
a spoken error, and the app must not crash. Turn it back off.

**7. Home Screen widget.** Long-press an empty area of the Home Screen → **Edit** →
**Add Widget** (or the **+** in the top-left) → search **"Dear Future Me"** → pick the
**small** size → **Add Widget** → **Done**. Confirm: cream card, orb, one of the three
prompts, "Dear Future Me" wordmark. Add the **medium** size too and confirm the
"Tap to talk" pill. **Tap the widget** → the app opens listening.

**8. Lock Screen widget.** Lock the phone, then long-press the Lock Screen →
**Customize** → **Lock Screen** → tap the area **below the clock** (rectangular) or
**above it** (circular) → find **Dear Future Me** → add → **Done** → **✕**. Lock and
look: the mic glyph and short text should be legible in the Lock Screen's tint. Tap
it → Face ID → app opens listening.

> If "Dear Future Me" never appears in the widget gallery: in Xcode set the scheme
> (toolbar, left of the destination) to **DFMWidget**, press ▶ once, choose the app
> when asked which to run, then set the scheme back to **DearFutureMe**. Building the
> widget target once registers it with the system.

**9. Siri.** Say **"Hey Siri, talk to Dear Future Me"**. The app should open
listening. Also try "Tell Dear Future Me something".
*Siri phrase matching on a fresh install is genuinely flaky and can take a few
minutes or a re-install to index — the widget is the dependable demo path. Do not
burn more than 5 minutes here.*

**10. Action Button** (iPhone 15 Pro and later only). On the phone:
**Settings > Action Button** → swipe the carousel to **Shortcut** → tap
**Choose a Shortcut** → find **Talk** (under Dear Future Me) → select it. Now
long-press the Action Button: app opens listening.
*No Action Button on this phone? Skip it — the widget covers the same beat.*

### The demo: five moments (VOICE_OS_PLAN.md TL;DR / FUTURE_PLAN.md §27)

Rehearse twice, stopwatch it, target under 3 minutes. Use AirPods if the room is
noisy. Start from a **Home Screen widget tap** — never from the app icon; the widget
is the pitch.

1. **Capture** — tap the widget, then say:
   > "I just finished something I've been working on for months and I'm really proud of myself."

   The agent asks one intelligent follow-up. Answer it. A proud moment is saved.

2. **Future message** — say:
   > "I want future me to remember how this feels."

   The agent creates a Future Letter / voice time capsule.

3. **Memory intelligence** — say:
   > "Have I ever felt like this before?"

   The agent searches past memories and returns a relevant one.

4. **Playback** — say:
   > "Play it."

   Past You is read aloud.

5. **Payoff** — the agent contrasts then and now, along the lines of:
   > "You sounded unsure then. Today you're describing finishing the thing you were afraid to start."

6. **Closer (the beat the spec doesn't have):** open the website's `/notebook` on the
   Mac and show the letter that the voice session just created sitting there. Same
   account, same data — that is the API-first proof.

> Moments 3–5 need history in the account. **Before rehearsing, seed 2–3 older
> entries** (through the web notebook or the API) with something anxious about
> starting the same project — otherwise the search returns nothing and the payoff
> line has nothing to contrast.

---

## 10. Polish pass with screenshots

The overnight visuals were written without ever being rendered. Plan an explicit
polish loop today:

1. Run the app in the **simulator** (Xcode toolbar destination → any iPhone) — fine
   for looks, useless for mic.
2. Screenshot with **⌘S** in the Simulator (saves to Desktop), or on device with the
   usual button combo. For widgets, add them to the simulator's Home Screen the same
   way as §9 step 7.
3. **Paste the screenshots into a Claude Code session** and ask for concrete
   adjustments to `OrbView` / `VoiceSessionView` / `DFMWidget.swift`. Iterate: change,
   re-run, re-screenshot. Two or three rounds is usually enough.

Check every screenshot against the DESIGN_SYSTEM.md §17 non-negotiables:

- [ ] **Cream `#F9F5ED`, never white.** Any pure-white surface is a bug. Check the
      settings sheet and any system-default background especially.
- [ ] **Text is green-tinted** `#5D8E67` / `#3a5c42` — never gray, never black. This
      includes placeholder text, captions, and disabled states.
- [ ] **Hierarchy is opacity, not colour**: `/80` → `/70` → `/55` → `/30` on one green.
      If two text colours differ in hue, that is the bug.
- [ ] **Both fonts present** — structured Comfortaa *and* handwritten Caveat, in
      tension. One alone reads as a different product.
- [ ] **Nothing square**: `rounded-2xl`-equivalent corners on cards, full-round pills.
- [ ] **2px borders** on anything interactive; 1px on dividers.
- [ ] **Pastel accents at low opacity only**, drawn from the four-accent set
      (yellow / peach / soft green / soft blue).
- [ ] **Shadows are green-tinted** `rgba(93,142,103,…)`, never neutral gray.
- [ ] **Motion is slow and small** — 4–6pt travel, ~1.02 scale, 6–9s ambient cycles.
      A fast or large orb pulse is off-brand. (Widgets are static by design; this
      applies to the app only.)
- [ ] **Asymmetry is intentional** — offset margins, left-aligned headers, small
      rotations. Do not "fix" them into centred symmetry.
- [ ] Widget legible in **both light and dark** Home Screens, and under Lock Screen
      tinting.

---

## 11. Troubleshooting

**No sound from the agent after the mic has been used** (the classic).
`AVAudioSession` was left in a recording configuration. In `Speaker.swift` /
`SpeechRecognizer.swift`, the session category must be `.playAndRecord` with the
`.defaultToSpeaker` option, set **before** speaking, and the recognition request's
audio engine must be stopped and its tap removed first. Also check the phone's
**physical mute switch** and that the volume is up — twice now this has been the
actual cause.

**Permission alerts never appear / instant crash on tapping the orb.**
A usage string is missing (§5a) or spelled wrong. Check both
`NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription` are present
on the **app** target's Info tab. Delete the app from the phone and reinstall — iOS
caches the denial otherwise. If you previously tapped "Don't Allow": phone
**Settings > Dear Future Me** → re-enable Microphone and Speech Recognition.

**Widget does not appear in the gallery.**
In order: (a) build and run the **DFMWidget scheme** once (§9 step 8 note);
(b) confirm `DFMWidget.swift` and `DFMWidgetBundle.swift` have **only** DFMWidget
ticked in Target Membership (⌥⌘1); (c) confirm the widget's bundle id is exactly the
app id plus `.DFMWidget`; (d) delete the app from the phone, rebuild, and re-add.
Restarting the phone genuinely helps — the widget daemon caches aggressively.

**Widget shows but renders blank or clipped.**
`containerBackground(for: .widget)` is missing or the deployment target is below
iOS 17. Both are handled in the committed file — this only appears if someone edits it.

**"Failed to register bundle identifier" / "The app ID cannot be registered".**
That identifier is taken (often by an earlier attempt of yours) or you have burned
the 10-App-IDs-per-week limit. Do **not** improvise a new id — change the bundle id
back to the exact strings in §7a, clean (**Product > Clean Build Folder**, ⇧⌘K) and
retry. If the weekly limit is genuinely hit, the only remedy is a different Apple ID
or waiting out the 7-day window.

**"Untrusted Developer" when launching on the phone.**
Expected on a free account. Phone: **Settings > General > VPN & Device Management** →
tap your Apple ID under *Developer App* → **Trust**. If the entry is not there, the
install did not complete — read the Xcode error above the launch failure.

**App launched fine last week, now says the app is no longer available.**
The 7-day free provisioning profile expired. Plug in, press ▶, done.

**"Cannot find 'X' in scope" after adding files.**
The file holding `X` is not in that target. Select it → File Inspector (⌥⌘1) →
Target Membership.

**"Invalid redeclaration" / "'main' attribute can only apply to one type".**
A template file survived, or a file is ticked into both targets. Revisit §2a (delete
the app template files) and §6 steps 5–6 (delete the widget template files, tick only
DFMWidget).

**Siri does not recognise the phrases.**
Rebuild and relaunch, then wait a few minutes; App Shortcut phrases are indexed
asynchronously. Confirm the app's display name is "DearFutureMe"/"Dear Future Me" —
the phrases interpolate the application name, so Siri listens for whatever the app is
actually called. Not worth debugging on demo day; use the widget.

---

## 12. Known gaps from the overnight session

- Nothing here has ever been *built for iOS*. Xcode 26.6 turned out to be installed,
  but its licence has not been accepted (needs a password nobody was awake to type).
  The integration pass did get further than syntax-parsing: every file parses clean,
  and the six Foundation-only files (`DFMConfig`, `DFMAPI`, `ClaudeClient`,
  `DFMTools`, `AgentLoop`) fully **type-check together**, as does `SettingsView`
  against a stubbed theme. The SwiftUI/audio files (`VoiceSessionView`, `OrbView`,
  `SessionController`, `SpeechRecognizer`, `Speaker`, widget files) are parse-only —
  expect any first-build fixes to cluster there. None of the logic has run.
- `TalkIntent.swift` posts `Notification.Name.dfmStartListening`, which is declared in
  `DearFutureMeApp.swift`. If the build says that name is unknown, the declaration was
  lost — add `extension Notification.Name { static let dfmStartListening = Notification.Name("DFMStartListening") }`
  to `DearFutureMeApp.swift` (**only there** — declaring it twice in the app target is
  an error).
- The widget's theme values are **duplicated** in `DFMWidget.swift` (`WidgetTheme`)
  because a widget extension cannot see app-target types. Change a colour in one
  place and change it in the other.
- API keys live in `UserDefaults` (demo-only, flagged in `DFMConfig.swift`).
