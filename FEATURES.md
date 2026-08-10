# Dear Future Me — Exhaustive Feature Inventory

> **Ground truth:** `src/` (branch `futureplan`), `supabase/migrations/*.sql`, `api/cron/`, `vercel.json` as of 2026-08-06.
> **This document supersedes `AUDIT.md`** (which describes a stale, pre-rebuild codebase: `/dashboard`, `/journal`, `/survey`, `ThemeContext`, etc. — none of which exist today) and supersedes the "current state" claims in `MIGRATION_PLAN.md` (much of which has since been implemented, and some of which was implemented differently than planned). See the **Discrepancies** section near the end.
>
> Purpose: a complete feature spec for rebuilding a sibling app without losing behavior.

---

## 0. Tech Stack & App Shell

### Stack
| Thing | Value |
|---|---|
| Framework | React 18.3 + TypeScript, Vite 5.4 |
| Routing | `react-router-dom` ^7.15 (`BrowserRouter`) |
| Styling | Tailwind CSS 3.4 (all colors are inline arbitrary hex, **no theme context, no dark mode**) |
| Animation | `framer-motion` ^11.3 |
| Icons | `lucide-react` ^0.344 |
| Backend | `@supabase/supabase-js` ^2.57 |
| Email (edge fn only) | `resend` ^3.2 |
| Deploy | Vercel (`vercel.json` declares a cron) |

Scripts: `dev`, `build`, `lint` (eslint), `preview`, `typecheck` (`tsc --noEmit -p tsconfig.app.json`).

### Fonts (loaded in `index.html` from Google Fonts)
- **Comfortaa** (300–700) — `font-comfortaa`, the body/UI font, also `html { font-family }` default.
- **Caveat** (400–700) — `font-handwriting` utility, used for all "handwritten" annotations, prompts, and journal text.
- **Playfair Display** italic — `.font-italic-serif` utility, **defined but never used**: the class appears only in `src/index.css`, no component or page applies it. The font is still fetched on every page load.

### Palette (hardcoded hex everywhere; also mirrored in `tailwind.config.js` as named colors that the code mostly does NOT use)
| Hex | Role | Tailwind alias |
|---|---|---|
| `#5D8E67` | Primary deep green (text, buttons, borders) | `green.deep` |
| `#9FD89C` | Soft green (accents, borders) | `green.soft` |
| `#F9F5ED` | Cream page background | `cream` |
| `#FEE188` | Soft yellow (sticky notes, letters) | `yellow.soft` |
| `#FFD1BD` | Peach (check-in, accomplishments) | `peach` |
| `#B7E3FF` | Soft blue (stories, vision board) | `blue.soft` |
| `#3a5c42` / `#2d4a35` | Deep green ink for handwriting | — |
| `#faf8f2`, `#f5f1e8`, `#f2ede3`, `#e4ddd0`, `#c8b89a`, `#d4c99a`, `#9b8c72` | Paper / notebook / spiral-ring browns | — |

### Global CSS utilities (`src/index.css`)
- `.bg-grid` — 28px grid-paper background (green 7% opacity lines). Applied by `PageWrapper` by default.
- `.bg-lined` — 28px ruled-line background (used in FeedbackPage textarea, CheckOutPage textarea, landing letter card).
- `.card-hover` — `translateY(-4px)` + shadow on hover, 0.25s.
- `.font-handwriting`, `.font-italic-serif`, `.writing-vertical-lr`, `.line-clamp-2`, `.line-clamp-3`.
- **Reduced-motion**: a `@media (prefers-reduced-motion: reduce)` block kills `animate-float`, `animate-float-slow`, `animate-float-delayed`, `animate-sparkle`. Framer Motion is additionally wrapped in `<MotionConfig reducedMotion="user">` in `App.tsx`.

### Tailwind keyframes/animations
`float` (6s ±12px), `float-slow` (9s), `float-delayed` (7s, 2s delay), `sparkle` (2s opacity+scale pulse), `fade-up`. Shadows: `soft`, `card`, `card-hover`.

### App shell composition
```
<MotionConfig reducedMotion="user">
  <AuthProvider>
    <BrowserRouter>
      <AppShell>            ← flex column, min-h-screen, bg #F9F5ED
        <Navbar />          ← sticky top, z-50
        <div class="flex-1"><Routes/></div>
        <Footer />          ← mt-auto
      </AppShell>
```
- `AppShell` (`src/components/layout/AppShell.tsx`) wraps **every** route including `/notebook` (which then renders its own full-height layout inside).
- `PageWrapper` (`src/components/layout/PageWrapper.tsx`) — `<main class="min-h-screen bg-grid bg-[#F9F5ED]">`; props `className`, `grid` (default true, turns off grid paper). Used by every page **except** `MyNotebookPage`'s signed-in view.
- Page title: `Dear Future Me`; meta description: "Dear Future Me – A student mental wellness and reflection platform."; favicon still `/vite.svg` (default Vite placeholder — not branded).

---

## 1. Route / Page Inventory

From `src/App.tsx` (43 lines, no lazy loading, no 404/catch-all route, no nested routes):

| # | Path | Component | File | Auth gate |
|---|---|---|---|---|
| 1 | `/` | `LandingPage` | `src/pages/LandingPage.tsx` | None |
| 2 | `/check-in` | `CheckInPage` | `src/pages/CheckInPage.tsx` | None |
| 3 | `/explore` | `ExplorePage` | `src/pages/ExplorePage.tsx` | None (auth optional; only the letter-save path requires it) |
| 4 | `/check-out` | `CheckOutPage` | `src/pages/CheckOutPage.tsx` | None |
| 5 | `/stories` | `StoriesPage` | `src/pages/StoriesPage.tsx` | None |
| 6 | `/about` | `AboutPage` | `src/pages/AboutPage.tsx` | None |
| 7 | `/feedback` | `FeedbackPage` | `src/pages/FeedbackPage.tsx` | None |
| 8 | `/sign-in` | `SignInPage` | `src/pages/SignInPage.tsx` | None |
| 9 | `/sign-up` | `SignUpPage` | `src/pages/SignUpPage.tsx` | None |
| 10 | `/notebook` | `MyNotebookPage` | `src/pages/MyNotebookPage.tsx` | **Yes — inline soft gate** |
| 11 | `/before-it-breaks` | `BeforeItBreaksPage` | `src/pages/BeforeItBreaksPage.tsx` | None |

**Notes on routing:**
- There is **no `<ProtectedRoute>` component and no redirect-based protection.** `/notebook` is the only gated page and it gates *inside the component*: `if (!user) return <sign-in prompt card>`. The URL still resolves; nothing redirects.
- **No 404 route.** Any unmatched path renders the shell (Navbar + Footer) with an empty body.
- **`/before-it-breaks` is orphaned in-app**: the route is registered and the page exists, but *nothing in the UI navigates to it*. Navbar, Footer, and every landing-page CTA point at the **external** game URL instead, and the landing "Try Before It Breaks" button scrolls to an on-page section. The page is only reachable by typing the URL.
- No route-level scroll-restoration; `html { scroll-behavior: smooth }` is global.

---

## 2. Global Chrome (present on every page)

### 2.1 Navbar — `src/components/layout/Navbar.tsx`
Sticky (`sticky top-0 z-50`), `bg-[#F9F5ED]/80 backdrop-blur-sm`, bottom border `#9FD89C/25`, fixed height `h-14`. Fades in on mount (`opacity 0→1`, 0.3s).

**Local state:** `open: boolean` (mobile menu).
**Context:** `useAuth()` → `{ user, signOut }`.
**Derived:** `displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'You'`.

| Element | Behavior |
|---|---|
| Logo button (DFM icon + "Dear Future Me" wordmark) | `navigate('/')`. Focus-visible ring. |
| Desktop nav links (from `data.navLinks`) | `NavLink` → Home `/`, Check In `/check-in`, Explore `/explore`, Check Out `/check-out`, Stories `/stories`, About `/about`. Active state = pill `bg-[#9FD89C]/45`. Each has a framer-motion underline that scales X 0→1 on hover (origin left, 0.2s). |
| "Before It Breaks" + external-link icon | `<a href={BEFORE_IT_BREAKS_URL} target="_blank" rel="noreferrer">` → `https://before-it-breaks.vercel.app/`. Same hover underline. **Not** the internal `/before-it-breaks` route. |
| Divider | 1px vertical rule. |
| **When signed in** | (a) `displayName` shown as plain text; (b) "My Notebook" NavLink → `/notebook` with BookOpen icon, active pill `bg-[#FEE188]/50`; (c) "Log out" button → `await signOut()` then `navigate('/')`. |
| **When signed out** | (a) "Sign In" NavLink → `/sign-in`; (b) "Sign Up" solid green button → `navigate('/sign-up')`. |
| Hamburger (below `lg`) | Toggles `open`; icon swaps Menu ↔ X; `aria-label="Toggle menu"`. |
| Mobile menu (when `open`) | Same nav links (each closes the menu on click) + external Before It Breaks link + an auth row: signed in → "My Notebook" + "Log out"; signed out → "Sign In" + "Sign Up". |

**Note:** the Navbar does **not** consult `loading` from AuthContext, so on first paint it briefly renders the signed-out state for an already-signed-in user (auth-state flash).

### 2.2 Footer — `src/components/layout/Footer.tsx`
Three-column grid (stacks on mobile):
1. **Brand** — `LogoSlot size="lg"` + handwriting tagline: "A space for students to pause, reflect, and remember they are more than what they achieve."
2. **Pages** — links from `data.footerLinks` = `navLinks` + `{ Feedback, /feedback }` → Home, Check In, Explore, Check Out, Stories, About, Feedback. (No Sign In / Sign Up / Notebook / Before It Breaks in the footer.)
3. **In Collaboration With** — `PartnerLogoSlot name="NeuroHealth Alliance"` (renders `src/assets/partners/NHA_logo.png` + caption).

Bottom bar: "In collaboration with NeuroHealth Alliance" (left) and "© 2026 Dear Future Me - made with ♥ for students" (right, heart is a filled peach Lucide `Heart`).

### 2.3 Shared UI primitives (`src/components/ui/`)
| Component | Behavior / notes |
|---|---|
| `Button` | framer-motion button. Variants: `primary` (solid `#5D8E67`), `secondary` (transparent + green border), `ghost` (`#9FD89C/25` fill), `game` (cream fill, full width — **never used**). Sizes `sm|md|lg`. Props `fullWidth`, `disabled`, `type`, `className`, `onClick`. Hover `scale 1.02`, tap `scale 0.98` (both disabled when `disabled`). Focus ring `#5D8E67` with offset. Disabled → 50% opacity + not-allowed cursor. **The onClick signature takes no event argument.** |
| `SurveyActionCard` | Cream card, green border, centered. Renders a framed DFM logo, optional `title`/`description`, a primary Button and an optional secondary Button, and a Shield + "Anonymous & judgment-free" footnote. Used by CheckIn and CheckOut. |
| `StoryCard` | Sticky-note style card; props `text`, `tags[]`, `color` (`yellow|peach|softgreen|softblue`), `rotation` (string deg). Renders a pin dot, the text in quotes in handwriting, and tag pills. Variants `hidden/visible` for stagger parents; hover lifts `y:-6` with shadow. |
| `DfmIconSlot` | Renders real PNG assets: `logo`, `pencil`, `notebook`, `scissors`, `glue` from `src/assets/icons/`. Sizes `xs`(28px) `sm`(40) `md`(56) `lg`(80). |
| `LogoSlot` | DFM logo PNG + optional "Dear Future Me" wordmark. Sizes `sm|md|lg` (only `lg` is used in practice). Used by Footer, SignInPage, SignUpPage. The Navbar does **not** use it — it hand-rolls the same lockup from `DfmIconSlot` + an identically-styled span. |
| `PartnerLogoSlot` | Special-cases the names `"NeuroHealth Alliance"` / `"NeuroHealthAlliance"` → real NHA logo PNG + caption. Any other name → a dashed "Logo Slot" placeholder box. |
| `AvatarSlot` | Inline SVG "sprout envelope" mascot **placeholder** (TODO comment says replace with real mascot). Sizes `sm|md|lg|xl`, `animated` adds `animate-float`. Used only on BeforeItBreaksPage. |
| `IconPlaceholder` | Maps a string key → Lucide icon (heart, compass, star, mail, award, image, refresh, feather, book, pencil, leaf, sparkles, users, shield, clock, play, check, arrow, gamepad; fallback Sparkles) inside a tinted rounded square. Used by AboutPage beliefs and by ActivityCard. |
| `ActivityCard` | **DEAD CODE** — not imported anywhere. Would render a `data.activities` entry; its only click behavior is: if `id === 'before-it-breaks'`, open the external game in a new tab; otherwise no-op. |
| `FilterChip` | **DEAD CODE** — mood-filter pill, never imported. |
| `StatCard` | **DEAD CODE** — never imported. |
| `IllustrationSlot` | **DEAD CODE** — never imported. |

---

## 3. Page-by-Page Inventory

---

### 3.1 `/` — LandingPage (`src/pages/LandingPage.tsx`, 713 lines)

**Purpose:** Editorial "desk composition" home page — sells the product, previews the game, shows live community notes, funnels to `/check-in`.

**Local sub-components defined in-file:**
- `CountUp({target, suffix})` — motion value spring (stiffness 40, damping 15) from 0 → target on mount, rendered with `toLocaleString()`.
- `HandwrittenLabel` — Caveat text at `#5D8E67/55`, `text-3xl`, `select-none`.
- `PinDot` — 10px colored dot.
- `StickyNote({text, rotate, color, className})` — rotated sticky note with a pin dot + handwriting text, `card-hover`.
- `MiniMeter({label, value, barColor})` — label + `value%` + a 1.5px-tall bar whose width animates via CSS `transition: width 0.6s ease`.

**Local state:**
| State | Type | Purpose |
|---|---|---|
| `gameChoice` | `number \| null` | Which AP-load choice is selected in the two inline game widgets. Shared by both widgets. |
| `communityNotes` | `string[]` | Testimonial texts pulled from Supabase. |
| `communityLoaded` | `boolean` | Gates the community-notes wall. |

**Supabase read (on mount, `useEffect` with `[]`):**
```
supabase.from('testimonials')
  .select('testimonial_content')
  .eq('is_approved', true)
  .order('created_at', { ascending: false })
  .limit(6)
```
On success with ≥1 row → `communityNotes = data.map(r => r.testimonial_content ?? '')`. `communityLoaded` is set true in *all* cases (success, empty, or error). **No error surface** — on error the wall silently does not render.

**Derived meters:** if `gameChoice !== null` → `{ social: gameChoices[i].social, mental: 100 - gameChoices[i].stress, physical: gameChoices[i].energy }`, else the defaults `{ social: 70, mental: 65, physical: 75 }`.

**Helper handlers:**
- `scrollToBeforeItBreaks()` → `document.getElementById('before-it-breaks-section').scrollIntoView({behavior:'smooth', block:'start'})`.
- `openBeforeItBreaks()` → `window.open(BEFORE_IT_BREAKS_URL, '_blank', 'noopener,noreferrer')`.

#### Sections in order

**A. Above-the-fold "desk composition"** (`overflow-hidden`, decorative layer)
- Decorations (all `pointer-events-none`): 3 filled `#FEE188` stars with `animate-float` / `animate-float-slow` / `animate-float-delayed`; 2 `Sparkles` with `animate-sparkle`; two blurred radial blobs (green top-right, peach bottom-left).
- **Left card — "the open letter":** cream `#FDFAF3` card with a simulated red margin line, three hole-punch circles, and `.bg-lined` ruled paper.
  - Annotation above it: handwriting "✏ start here".
  - Salutation: "Dear Future Me," (Caveat, 4xl).
  - H1: "You are **more than** what you're trying to prove." — "more than" carries a hand-drawn SVG yellow underline squiggle.
  - Body paragraph + italic pull-quote: *"Built for the student who looks fine on paper but feels overwhelmed inside."*
  - **CTA row (left-aligned, not centered):**
    - `Button primary md` **"Start Reflection"** → `navigate('/check-in')`.
    - Text link **"Explore activities →"** → `navigate('/explore')`.
- **Right column — two portal cards** (annotation above: handwriting "what are you carrying?"):
  - **Check In card** (peach). `role="button"`, `tabIndex=0`, click **and** `Enter` keydown → `navigate('/check-in')`. Contents: "Step 1" eyebrow, ArrowUpRight that darkens on group hover, title "Check In", copy, and a 5-segment progress strip with 2 of 5 filled + "2 min".
  - **Stories card** (soft blue). Same click/Enter → `navigate('/stories')`. Shows the first 2 **static** stories from `data.stories` (`slice(0,2)`), each `line-clamp-2`, plus the annotation "you're not the only one →".
- **Bottom row:**
  - **Impact receipt** (annotation "proof this helped"): a receipt-styled card. Header bar "FIELD NOTES" + "2023–2026". Dashed dividers. Two animated `CountUp` lines: **26** schools reached, **720** workshop attendees. Highlighted footer block: "AVG. ANXIETY SCORE" → **3.95 → 3.32** + "after reflection". *(All hardcoded.)*
  - **Sticky-note cluster** (hidden below `sm`): annotation "anonymous student notes" with a hand-drawn SVG arrow, plus 3 absolutely-positioned rotated sticky notes with **hardcoded** text: "I thought everyone else had it figured out. They didn't." / "Sleeping before midnight felt rebellious." / "Rest isn't a reward I have to earn."

**B. "A path, not a checklist." — Journey path** (bg `#F9F5ED`)
- Reveal-on-scroll: `initial {opacity:0, y:24}` → `whileInView {opacity:1,y:0}`, `viewport {once:true}`, 0.5s. (This same pattern is used for sections C and D.)
- Heading block: handwriting eyebrow "how it works" + H2 "A path, not a checklist." + notebook icon.
- A vertical SVG line in the left gutter connects the steps.
- **5 steps** (note: the page renders **five**, while `data.howItWorksSteps` defines only four — the data array is unused here):
  1. **Check in with yourself** (peach, Heart icon) — "Begin →" button → `navigate('/check-in')`. Side sticky note: "2 minutes. That's all."
  2. **Choose what you need** (yellow, BookOpen) — "Explore →" → `navigate('/explore')`. Side: scissors icon.
  3. **Reflect, write, or play** (soft green, Gamepad2) — "Try Before It Breaks →" → `scrollToBeforeItBreaks()` (in-page smooth scroll, **not** navigation). Beside it, an **inline mini game card** (dark green): prompt "How many APs are you taking?", the 3 `gameChoices` as buttons (`e.stopPropagation()` then `setGameChoice(i)`; selected = yellow filled + bold), two `MiniMeter`s (Mental, Physical), and the hint "tap a choice ↑".
  4. **See you're not alone** (soft blue, Users) — "Read stories →" → `navigate('/stories')`. Below it, 2 margin notes rendering **static** `data.stories.slice(3,5)`, `line-clamp-3`.
  5. **Leave with perspective** (deep green, Sparkles) — "Check out →" → `navigate('/check-out')`. Side sticky note: "you made space for yourself today. that counts."

**C. Before It Breaks featured portal** — `id="before-it-breaks-section"`, dark green `#5D8E67`, grid overlay at 7%, 2 floating stars.
- Left: eyebrow "a dear future me interactive story", H2 "Before It Breaks", description ("Navigate a simulated semester where every choice — classes, sleep, friendships, self-care — shapes your well-being meter in real time."), handwriting quote *"It doesn't tell you the right answer. It shows you what happens when you choose."*
  - `Button primary lg` **"Enter the Semester"** (restyled yellow) → `openBeforeItBreaks()` (external, new tab).
  - `Button secondary md` **"Open Simulator"** → `openBeforeItBreaks()` (same target).
- Right: interactive widget in a cream card. Annotation "✏ tap a choice to see the meters shift". Legend dots (Social peach / Mental yellow / Physical blue). Three `MiniMeter`s. Scenario text: "Course registration glows on your laptop. / How much are you loading onto this year?" Three choice buttons → `setGameChoice(i)` (selected = solid green). When a choice is selected, appends: *"Notice how the meters shifted. That's you, on paper."*
  - Both game widgets on the page share the single `gameChoice` state, so selecting in one updates the other.

**D. Community notes wall** (live data)
- Header: eyebrow "from the community", H2 "You're not the only one.", subtitle "Real reflections. Anonymous students. Genuine moments.", glue icon.
- **Conditional:** the wall only renders when `communityLoaded && communityNotes.length > 0`. Otherwise the section shows only the header and the bottom link (no skeleton, no empty message, no error message).
- Layout is a deliberately non-grid, two-row scatter using indices `0..5` of `communityNotes`:
  - Row 1: `StickyNote[0]` (yellow, -1.5deg) · a "folded letter" card with faux fold lines showing `[1]` (soft blue, 0.8deg) · `StickyNote[4]` (peach, 2deg, hidden below `sm`).
  - Row 2 (indented): green card `[2]` (-0.5deg) · `StickyNote[3]` (yellow, 1.5deg) · `StickyNote[5]` (soft blue, -2.5deg, hidden below `md`).
  - Absolute annotation (lg+ only): "pinned by students like you" + hand-drawn SVG arrow.
  - Missing indices fall back to `''` (an empty note renders rather than being skipped).
- Bottom: **"Read all stories →"** button → `navigate('/stories')`, with an arrow that translates on hover, followed by a hairline rule.

**E. Final CTA** (`bg-[#FEE188]/15`, top border)
- Left: handwriting "a note from us", H2 "Write to the version / of yourself who / made it through.", handwriting body "You don't need to have it figured out. You just need five minutes and a little honesty."
- Right: `Button primary lg` **"Start Your Reflection"** → `navigate('/check-in')`; below it a text link **"Create a free account to save your work"** → `navigate('/sign-up')`.
- Decorative floating star cluster (lg+, `pointer-events-none`).

**Conditional rendering summary:** community wall gated on data; a "meters shifted" caption gated on `gameChoice !== null`; several decorations hidden at `sm`/`md`/`lg` breakpoints. **No auth-conditional rendering on this page at all.**

---

### 3.2 `/check-in` — CheckInPage (`src/pages/CheckInPage.tsx`, 79 lines)

**Purpose:** Step 1 of the journey — hand off to the external pre-reflection QuestionPro survey, then continue.

**Local state:** none. **Supabase:** none.

**Sections in order:**
1. **Header** — DFM logo PNG (80px), pill eyebrow "step 1 of your journey", H1 "Before you begin, / check in with yourself.", handwriting subtitle "This is not a test. It's a moment to notice what you're carrying before anything else."
2. **`SurveyActionCard`**
   - title: "How are you feeling right now?"
   - description: "A few quick, honest questions before you start. Under 2 minutes. No right answers — just you, noticing yourself."
   - **Primary "Open Check-In Survey"** → `window.open(PRE_SURVEY_URL, '_blank', 'noopener,noreferrer')` → `https://neurohealthalliance.questionpro.com/t/AbYLCZ6Dsf`
   - **Secondary "I Finished, Continue"** → `navigate('/explore')`
   - Footnote: Shield + "Anonymous & judgment-free"
3. **Privacy card** (soft blue) — "Your privacy is protected" + 4 bullets:
   - "All responses are anonymous — no names, no grades attached" (Shield)
   - "No judgment, no right answers, no scores" (Eye)
   - "Built on real data from 1,109 students like you" (Star)
   - "You can skip any question and continue as a guest" (Star)
4. **Skip link** — handwriting underlined "Skip for now and explore activities →" → `navigate('/explore')`.

**Animation:** whole page container fades/slides in on mount (`opacity 0→1, y 30→0`, 0.45s easeOut).
**States:** no loading/error/empty states (nothing async). There is **no tracking** of whether the survey was actually completed — "I Finished, Continue" is on the honor system.

---

### 3.3 `/explore` — ExplorePage (`src/pages/ExplorePage.tsx`, 482 lines)

**Purpose:** Step 2 — an accordion of three reflection activities.

**Page-level state:**
| State | Default | Purpose |
|---|---|---|
| `open` | `'letter'` | Which accordion panel is expanded (`string \| null`). **The Letter panel is open by default.** |
| `communityCount` | `650` | Community letter count (fallback if RPC fails). |

**Page-level Supabase call (on mount):**
```
supabase.rpc('count_community_letters')
```
→ if `error`, `console.error('count_community_letters RPC error:', ...)` and keep the 650 fallback; if `typeof data === 'number'`, `setCommunityCount(data)`. No user-visible error state.

**Header:** pencil + scissors icons, pill eyebrow "step 2 — choose what you need", H1 "Choose what you need today.", handwriting subtitle "Some days you need to write. Some days you need to breathe. Some days you need to remember you are still becoming."

**Accordion behavior:** container is a framer-motion stagger parent (`staggerChildren: 0.1`, `whileInView`, `once:true`); each card animates `hidden {opacity:0,y:20} → visible`. Card header is a full-width button: clicking toggles (`setOpen(isOpen ? null : act.id)`) — so **only one panel can be open at a time, and clicking the open one closes it**. Body expands via `AnimatePresence` height `0 → auto` with opacity, 0.35s easeInOut. Chevron flips Up/Down.

Each card header shows: colored icon tile, uppercase tag eyebrow, title, handwriting subtitle.

#### Activity 1 — "Non-Resume Accomplishments" (peach, tag "Personal Growth", Award icon)
Subtitle: "Celebrate what matters beyond the application."

`NonResumeSection` state: `text: string`, `saved: boolean`.

- **Edit view:** descriptive paragraph ("Share something you're proud of that would never go on your resume…"), then a **notebook shell**: 18 spiral-ring circles, a date row showing `toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})`, a `s m t w t f s` day strip with today (`new Date().getDay()`) bolded, a 20px grid overlay, and an 8-row textarea in Caveat 1.1rem / line-height 1.9. Placeholder: "Write about something you're proud of that you'd never put on an application..."
- **Save button** (motion, `whileTap scale 0.95`): `disabled` when `!text.trim()`; on click sets `saved = true` **if** trimmed text is non-empty.
- **Saved view:** peach card labeled "SAVED" showing the text with `whitespace-pre-wrap`, plus an **"Edit"** underline button → `setSaved(false)`.
- **⚠ No persistence.** This activity performs **zero Supabase writes** and nothing is stored across a refresh. It is local state only, regardless of auth.

#### Activity 2 — "Create Your Vision Board" (soft blue, tag "Creative", scissors icon)
Subtitle: "A visual map of the future you want to grow toward."

`VisionBoardSection` state: `option: 'slides' | 'canva'` (default `'slides'`).

- Intro paragraph explaining what a vision board is.
- Notebook shell (spiral rings, date row, day strip, grid) containing:
  - **Two toggle pills** — "Google Slides" / "Canva" → `setOption(o)`. Selected = solid green.
  - **Numbered instruction list**, rendered in Caveat, with numbered dots tinted by option (peach for Slides, blue for Canva):
    - **Google Slides (5 steps):** 1) Go to [slides.new](https://slides.new) *(link, `target="_blank" rel="noreferrer"`, underlined)*; 2) File → Page setup → Custom, 8.5×11 or 11×8.5 in; 3) Insert → Image → Search the web; 4) Add text boxes with quotes/goals/words; 5) File → Download → JPEG or PDF.
    - **Canva (4 steps):** 1) Go to [canva.com](https://canva.com) *(link, new tab)* and log in / create a free account; 2) Search "vision board" or "poster"; 3) Add images, words, designs; 4) Share → Download → PNG or PDF.
- **Padlet embed:** handwriting lead-in "Ready to share? Upload to our community wall — anonymous and reviewed before posting." then a 480px-tall `<iframe src="https://padlet.com/embed/az8l0z5n3ovuib6a" allow="camera;microphone;geolocation" title="Dear Future Me Vision Board Community Padlet">`.
- **"Open Padlet in new tab"** link → `https://padlet.com/suhani3/dear-future-me-az8l0z5n3ovuib6a`, `target="_blank" rel="noreferrer"`, with an ExternalLink icon.
- No Supabase, no `vision_boards` table usage.

#### Activity 3 — "Letter to Your Future Self" (yellow, tag "Reflection", Mail icon) — **open by default**
Subtitle is dynamic: `` `${communityCount.toLocaleString()} letters saved by our community.` ``

`LetterSection` props: `communityCount`. State: `title`, `body`, `saved`, `saveError`. Uses `useAuth()` and `useNavigate()`.

- Intro paragraph; **counter badge** (Mail icon + `${communityCount.toLocaleString()} letters saved by our community`).
- **Notebook paper form:** 18 spiral rings; date row (long-format date) + `s m t w t f s` day strip with today bolded **and underlined**; a **title input** (mono font, placeholder `title`); a **14-row body textarea** (Caveat 1.1rem/1.9, placeholder `Dear Future Me,\n\nI want you to know...`); a live **`{body.length} chars`** counter in the footer.
- **Save button label is auth-conditional:** `user ? 'Save letter' : 'Sign in to save'`. Disabled when `!body.trim()`.
- **`handleSave()` logic, exactly:**
  1. If `!body.trim()` → return (no-op).
  2. If `!user` → `navigate('/sign-in')` and return. *(The typed content is lost — nothing is stashed.)*
  3. Clear `saveError`, then:
     ```
     supabase.from('journals').insert({
       user_id: user.id,
       type: 'letter',
       title: title.trim() || 'Untitled',
       content: body.trim(),
       is_public: true,        // ← letters saved here are PUBLIC
     })
     ```
  4. On error → `console.error` + `setSaveError('Something went wrong. Please try again.')` (rendered as red text above the button row).
  5. On success → `setSaved(true)`.
- **Saved view:** yellow card labeled "SAVED LETTER" with the title (if any) and the body in Caveat `whitespace-pre-wrap`; plus **"Edit letter"** (→ `setSaved(false)`) and a solid green **"View all my letters →"** (→ `navigate('/notebook')`).
- Secondary link below the form at all times: **"View my saved letters"** → `navigate('/notebook')`.

> **Privacy note worth carrying forward:** `is_public: true` on this insert means, under the `journals` RLS policy `"Users can view public journals" ... USING (is_public = true)` granted to `anon`, every letter saved from `/explore` is world-readable by anyone with the anon key. Letters created inside `/notebook` (`createEntry`) do **not** set `is_public` and therefore default to `false`.

**Bottom note:** handwriting "There's no wrong choice here. Whatever you pick is the right one."

**Not implemented on this page** (defined in `src/data/index.ts` but unused): the `activities` array's `before-it-breaks`, `gratitude` (Gratitude Note), and `reset` (Reset Card) entries; the entire `moodFilters` array and mood-based recommendation/filtering.

---

### 3.4 `/check-out` — CheckOutPage (`src/pages/CheckOutPage.tsx`, 113 lines)

**Purpose:** Closing step — external post-reflection survey + a private takeaway note.

**Local state:** `reflection: string`, `completed: boolean`. **Supabase: none.**

**View A — the form (when `!completed`)** (container fades/slides in, 0.45s):
1. **Header** — animated `Sparkles`, H1 "How do you feel now?", handwriting subtitle "Take one minute to notice what changed since you checked in."
2. **`SurveyActionCard`**
   - title "Post-Reflection Check-In", description "A few quick questions about how today's reflection landed. Anonymous, honest, and under 2 minutes."
   - **Primary "Open Post-Reflection Survey"** → `window.open(POST_SURVEY_URL, '_blank', 'noopener,noreferrer')` → `https://neurohealthalliance.questionpro.com/t/AbYLCZ6DtH`
   - **Secondary "Finish Journey"** → `setCompleted(true)`
3. **Optional reflection input** — label "One thing I want to remember is…", handwriting note "This stays with you. It's not shared anywhere.", a 4-row ruled (`bg-lined`) textarea, placeholder "Write something small. Just for you."
4. **`Button primary sm` "Save & Finish"** → `setCompleted(true)`. **No validation** — works with empty text. **Nothing is persisted anywhere** (not localStorage, not Supabase).

**View B — completion screen (when `completed`)**:
- Big green check circle; H2 "You made space for yourself today."; handwriting "That counts. It always did."
- Stat copy: "Students who completed a reflection saw their average anxiety score drop from 3.95 to 3.32. You just added to that." *(hardcoded)*
- **Conditional:** if `reflection` is non-empty, a yellow card labeled "something you wanted to remember" shows the text in quotes.
- Two buttons: `primary` **"Back to Home"** → `navigate('/')`; `ghost` **"Read Community Stories"** → `navigate('/stories')`.
- There is **no way back** to the form once completed (no reset button); a page reload restores View A with empty state.

---

### 3.5 `/stories` — StoriesPage (`src/pages/StoriesPage.tsx`, 198 lines)

**Purpose:** Public anonymous community wall + anonymous submission form.

**Module constants:** `COLORS = ['yellow','peach','softgreen','softblue']`, `ROTATIONS = ['-1deg','1.5deg','-0.5deg','1deg','-1.5deg','0.5deg']`. Color and rotation are assigned by **index modulo** at render, not stored.

**Local state:** `stories: Story[]`, `loadingStories` (init `true`), `fetchError: boolean`, `retryKey: number`, `storyText: string`, `submitted: boolean`, `submitError: string`.

**Supabase read** (`useEffect` keyed on `[retryKey]`; sets `loadingStories=true`, `fetchError=false` first):
```
supabase.from('testimonials')
  .select('testimonial_id, testimonial_content, tags')
  .eq('is_approved', true)
  .order('created_at', { ascending: false })
```
Mapped to `{ id: String(testimonial_id), text: testimonial_content ?? '', tags: Array.isArray(tags) ? tags : [], color: COLORS[i%4], rotation: ROTATIONS[i%6] }`. On error → `console.error` + `fetchError = true`. `loadingStories` set false in all paths. **No result limit** — the page fetches every approved testimonial.

**Supabase write** (`handleSubmit`):
```
supabase.from('testimonials')
  .insert({ testimonial_content: storyText.trim(), is_approved: false })
```
- Guard: returns early if `!storyText.trim()`.
- On error → `console.error` + `submitError = 'Something went wrong. Please try again.'` (red text above the button).
- On success → `submitted = true`. **The grid is NOT refetched** (correct, since new submissions are unapproved and would not appear anyway).
- `is_approved: false` means every submission requires out-of-band moderation before it shows up here or in the landing-page wall. No `user_id`, no `author_name`, no `tags` are sent — submissions are fully anonymous and untagged.

**Sections in order:**
1. **Header** — glue icon (lg), pill eyebrow "anonymous · real · yours", H1 "You're not the only one.", handwriting subtitle "Real reflections from students navigating pressure, comparison, burnout, and hope. Every story here was written for you."
2. **Story grid — four mutually exclusive states:**
   - `loadingStories` → centered "Loading stories…"
   - `fetchError` → "Couldn't load stories right now." + a **"Try again"** button → `setRetryKey(k => k+1)` (re-runs the effect).
   - `stories.length === 0` → "No stories yet — be the first to share."
   - else → responsive grid (1 / 2 / 3 columns) of `StoryCard`s; framer-motion stagger parent (`staggerChildren: 0.08`, `whileInView`, `once:true`); each card fades up and lifts on hover.
3. **Submission card** (cream, green border; reveals on scroll `y:30 → 0`, 0.45s):
   - H3 "Share something another student might need to hear."
   - Handwriting sub: "Anonymous. Honest. No name required. Just what's true for you right now."
   - **If `submitted`** → success block: circled Send icon, "Thank you for sharing." + "Your words will help someone feel less alone." *(No reset — the form does not come back without a reload.)*
   - **Else** → a decorative "sticky note with tape" composition: two faux tape strips (rotated blue and peach spans) at the top, a yellow note body with a folded top-right corner (CSS `before:` pseudo-element) and faux ruled lines, containing a 6-row transparent textarea in Caveat 1.45rem, placeholder "Write anonymously…". Then `submitError` (if any) and a full-width `Button primary` **"Share Anonymously"** (Send icon), `disabled` when `!storyText.trim()`.
   - Footnote (always visible): Shield + "Stories are reviewed before appearing publicly. No identifying information is collected."

---

### 3.6 `/about` — AboutPage (`src/pages/AboutPage.tsx`, 330 lines)

**Purpose:** Mission, impact numbers, full team bios with photos, timeline, partner.

**No state, no Supabase, no forms, and no interactive controls** — the only "behavior" is scroll-triggered animation and image resolution.

**Team photo resolution (notable mechanic):**
```ts
import.meta.glob('../assets/team/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF}', { eager: true, import: 'default' })
```
- `findTeamImage(memberKey, variant)` normalizes both sides (`lowercase`, strip non-alphanumerics) and matches files named `<Name>_<Variant>.<ext>` where variant ∈ `professional | little`.
- Fallback when no file matches: `https://placehold.co/600x760/<bg>/355842?text=<label>` — `f6efe0` bg for "… Professional", `d8efe0` for "… Little Me". **This is the only remote image dependency in the app.**
- `TeamPhotoStack` renders the professional portrait as a 4:5 rounded card with an overlapping square "little me" childhood photo pinned to its bottom-right corner (thick cream border, offset `-bottom-4 right-[-8px]`).
- Assets present today: Nikhilesh, Tanvi, Suhani, Sophia, Thanh, Sara, Avantika — each with `_Professional` and `_Little` (mixed extensions: `.jpeg/.jpg/.JPG`). All 7 members resolve; no placeholders are currently hit.

**Sections in order:**
1. **Page header** — H1 "About Dear Future Me" + mission sentence.
2. **"Meet the Founders"** — cream card with the origin paragraph and the byline "Nikhilesh Suravarjjala, Tanvi Bharadwaj, and Suhani Gupta".
3. **"the number that matters most"** — dark green card with grid overlay: **3.95** ("before") → ↓ "dropped to" → **3.32** ("after"), with the caption "Average self-reported anxiety score measured across 989 student post-reflections."
4. **"Team Bio"** — notebook + pencil icons flanking the heading, a short rule, then:
   - **Co-Founders** (3-col grid on `lg`, stagger 0.1): **Nikhilesh Suravarjjala**, **Tanvi Bharadwaj**, **Suhani Gupta** — each with full bio paragraph (verbatim in source), photo stack, name, role.
   - **Team Members** (2-col grid on `lg`, stagger 0.1, separated by a top border): **Sophia Wang**, **Thanh Duong**, **Sara Gholami**, **Avantika Raavi** — same card shape.
   - Cards animate `hidden {opacity:0,y:24} → visible` (0.45s) as part of the stagger.
5. **"Why Dear Future Me exists"** — yellow card: paragraph citing "surveyed 1,109 students across 26 schools" + handwriting quote *"We built Dear Future Me because we needed it ourselves."*
6. **"Our reach"** — 4 stat cards (2-col on `sm`), hand-rolled (not the `StatCard` component):
   | Value | Label | Sub |
   |---|---|---|
   | 1,109 | Pre-survey responses | from students across 26 schools |
   | 989 | Post-reflections completed | measuring real change over time |
   | 720 | Workshop attendees | in-person, at school events |
   | 26 | Schools reached | our strongest measure of scale |
7. **"What we believe"** — 4 belief cards, each with an `IconPlaceholder` (heart / shield / users / star):
   - "Students deserve spaces where they can reflect without being ranked, scored, or compared."
   - "Mental wellness is not a reward for achievement. It's a foundation for it."
   - "You don't have to feel alone in what you're going through."
   - "Rest, play, creativity, and relationships are not distractions. They are the point."
8. **"What the platform does"** — 5 bullets in a responsive grid (1/2/3 cols):
   - Emotional check-ins before and after each session
   - Reflection activities: writing, vision boarding, letters
   - Anonymous community stories from real students
   - Before It Breaks — an interactive simulator on academic pressure
   - Post-reflection moments that help students notice what shifted
9. **"Our journey"** — vertical timeline with a left rail and dot markers, from `data.timelineItems`. Each item animates in **alternating from left/right** (`x: i%2===0 ? -30 : 30 → 0`) with `delay: i*0.05`, `once:true`:
   | Year | Label | Description |
   |---|---|---|
   | 2023 | Research | Surveyed 1,109 high school students across 26 schools about academic pressure, burnout, and mental health. |
   | 2023 | Outreach | Connected with school counselors, educators, and students. Average anxiety score: 3.95 out of 5. |
   | 2024 | Workshops | Hosted in-person reflection workshops with 720 student attendees across ~33,200 reachable students. |
   | 2024 | Platform Launch | Launched the Dear Future Me digital platform for reflections, community stories, and interactive tools. |
   | 2025 | Measurable Impact | 989 post-reflections completed. Average anxiety score dropped from 3.95 to 3.32 after participation. |
   | 2026 | Expansion | Expanding to new schools, adding Before It Breaks, and growing the student community. |
10. **"In Collaboration With"** — "NeuroHealth Alliance" + `PartnerLogoSlot` (real NHA logo).

---

### 3.7 `/feedback` — FeedbackPage (`src/pages/FeedbackPage.tsx`, 138 lines)

**Purpose:** Categorized feedback capture, anonymous, written to Supabase.

**Local state:** `activeCategory` (default `'liked'`), `text`, `submitted`, `error`, `loading`.

**Categories** (module constant; each defines `id`, `label`, `placeholder`, `accent` classes that restyle the form card):
| id | Label | Textarea placeholder | Accent |
|---|---|---|---|
| `liked` | Something I liked | "What worked really well for you?" | soft green |
| `confused` | Something that confused me | "What felt unclear or hard to navigate?" | yellow |
| `wish` | Something I wish existed | "What would make this more helpful?" | soft blue |
| `story` | A story I want to share | "Tell us something that might help others..." | peach |
| `bug` | Bug or technical issue | "What went wrong? Where?" | muted green |

**Supabase write:**
```
supabase.from('feedback').insert({ feedback_content: text.trim(), category: activeCategory })
```
- Guard: early return when `!text.trim()`.
- `loading` true during the call; button label swaps to "Sending…" and is disabled.
- On error → `console.error` + `error = 'Something went wrong. Please try again.'` (red text above the button).
- On success → `submitted = true`.
- **No email is collected** even though the `feedback` table has an `email` column.

**View A — form (when `!submitted`):**
1. Header — pencil icon (lg), pill eyebrow "we actually read these", H1 "Help us make this softer, / safer, and more useful.", handwriting subtitle "Your feedback shapes the next version of Dear Future Me. Every message helps."
2. **Category pill row** (centered, wraps) — clicking a pill sets `activeCategory` **and clears `text` and `error`**. Selected pill = solid green. Focus ring `#5D8E67`.
3. **Form card** — its border/background come from the active category's `accent`. Shows the category label as H3, the fixed sub "Honest and specific is most helpful. Short is fine too.", a 6-row ruled (`bg-lined`) Caveat textarea with the category placeholder, the error line, and a full-width `Button primary lg` **"Send Feedback"** (Send icon), `disabled` when `!text.trim() || loading`.

**View B — success (early return, replaces the whole page):**
- Circled `CheckCircle`, H2 "Thank you for your feedback.", handwriting body "Every note you share helps us build something more useful, more honest, and more human."
- `Button primary` **"Submit Another"** → resets `submitted=false`, `text=''`, `error=''` (**keeps** the previously selected category).

---

### 3.8 `/sign-in` — SignInPage (`src/pages/SignInPage.tsx`, 136 lines)

**Purpose:** Email/password + Google sign-in.

**Local state:** `email`, `password`, `showPassword`, `error`, `loading`.
**Context:** `useAuth()` → `{ signIn, signInWithGoogle }`.

**Layout:** full-height centered card (`min-h-[calc(100vh-4rem)]`) over decorative floating stars and two blurred blobs; card fades/slides in (`y:30→0`, 0.45s). `LogoSlot size="lg"` at the top. H1 "Welcome back to your reflection space." + handwriting "Your journal is waiting."

**Error banner:** rendered above the form when `error` is set — red-50 background, red border, the **raw `error.message` from Supabase** (not sanitized or mapped to friendly copy).

**Form fields:**
| Field | Type | Validation | Notes |
|---|---|---|---|
| Email | `email` | `required` (native HTML) | placeholder `you@email.com` |
| Password | `password`/`text` | `required` (native). **No `minLength` here** (unlike sign-up) | Eye/EyeOff toggle button (`type="button"`) toggles `showPassword` |

Inputs are `motion.input` with `whileFocus={{ scale: 1.01 }}` (spring 300/25) and a border color transition to `#5D8E67` on focus.

**Submit (`handleSubmit`, on `<form onSubmit>`):**
1. `e.preventDefault()`, clear `error`, `loading = true`.
2. `await signIn(email, password)` → `supabase.auth.signInWithPassword`.
3. `loading = false`.
4. If `error` → `setError(error.message)`. Else → `navigate('/notebook')`.

Submit button is wrapped in a motion div with a `whileHover` green glow box-shadow; button is `disabled` while loading and its label swaps "Sign In" → "Signing in…".

**Other actions:**
- Divider "or".
- `Button ghost lg fullWidth` **"Continue with Google"** → `signInWithGoogle()` → `supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: `${window.location.origin}/notebook` } })`.
- `Button ghost lg fullWidth` **"Continue as Guest"** → `navigate('/explore')`.
- Footer text: "Don't have an account? **Sign Up**" → `<Link to="/sign-up">`.

**Notable absences:** **no "Forgot password?" control at all** (no `resetPasswordForEmail` anywhere in the app), no "remember me", no email-confirmation messaging, no redirect-back-to-intended-page (always lands on `/notebook`).

---

### 3.9 `/sign-up` — SignUpPage (`src/pages/SignUpPage.tsx`, 158 lines)

**Purpose:** Account creation.

**Local state:** `name`, `email`, `password`, `showPassword`, `error`, `loading`.
**Context:** `{ signUp, signInWithGoogle }`.

**Layout:** same centered-card treatment (stars, sparkles, a yellow blurred blob), `LogoSlot size="lg"`, H1 "Create a space to save / your reflections.", handwriting "A small corner of the internet that's yours."

**Form fields:**
| Field | Type | Validation | Notes |
|---|---|---|---|
| Name or nickname | `text` | **Not required** — optional | placeholder "What should we call you?" |
| Email | `email` | `required` | placeholder `you@email.com` |
| Password | `password`/`text` | `required`, **`minLength={6}`** | Eye/EyeOff toggle |

**Submit:** `e.preventDefault()` → clear error → `loading=true` → `await signUp(email, password, name)` → `loading=false` → on error `setError(error.message)`, else `navigate('/notebook')`.
Button label: "Create Account" / "Creating account…"; disabled while loading; same hover-glow wrapper.

**Other actions:** "or" divider · **"Continue with Google"** → `signInWithGoogle()` · **"Continue as Guest"** → `navigate('/explore')` · Shield footnote "You can use Dear Future Me without sharing personal details." · "Already have an account? **Sign In**" → `<Link to="/sign-in">`.

**Notable:** no password-confirm field, no client-side strength meter, no terms/privacy checkbox, and **no handling of Supabase's "confirm your email" flow** — if email confirmation is enabled on the project, `signUp` resolves without a session and the user is navigated to `/notebook` where they will see the signed-out gate.

---

### 3.10 `/notebook` — MyNotebookPage (`src/pages/MyNotebookPage.tsx`, 433 lines)

**Purpose:** The authenticated workspace — a two-pane IDE-like notebook (file-tree sidebar + grid-paper editor) over the `journals` table.

**Types:** `EntryType = 'letter' | 'note' | 'accomplishment'`; `Entry = { id, type, title, body, date, dayOfWeek }`.

**`TYPE_META`** — per type: label, icon, background, border:
| type | Label | Icon | Color |
|---|---|---|---|
| `letter` | Letter | DFM logo icon | `#FEE188/40`, border `#FEE188` (yellow) |
| `note` | Note | `FileText` | `#9FD89C/25`, border `#9FD89C` (green) |
| `accomplishment` | Accomplishment | `Award` | `#FFD1BD/40`, border `#FFD1BD` (peach) |

**Helpers:** `toDayKey(iso)` → `['sun'..'sat'][new Date(iso).getDay()]`; `toDisplayDate(iso)` → `toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})`.

**Page state:** `entries: Entry[]`, `activeId: string`, `sidebarOpen` (default `true`), `newType: EntryType` (default `'letter'`), `loading` (default `false`), `opError: string`.

#### Auth gate (early return when `!user`)
Rendered inside `PageWrapper`: notebook icon (lg), H1 "Your Notebook", handwriting "All your letters, notes, and accomplishments live here. Sign in to see them.", and a solid green **"Sign in to continue"** button (LogIn icon) → `navigate('/sign-in')`. **No redirect**; the URL stays `/notebook`.

#### Supabase operations
| Op | Call | Details |
|---|---|---|
| **Load** `loadEntries()` (in `useEffect` on `[user?.id]`, skipped when `!user`) | `from('journals').select('journal_id, type, title, content, created_at').eq('user_id', user.id).order('created_at', {ascending:false})` | Sets `loading` around it. On error: `console.error` + `opError = "Couldn't load your entries. Please refresh the page."`. On success: maps rows → `Entry` and sets `activeId = mapped[0]?.id ?? ''` (auto-selects the newest). |
| **Create** `createEntry(type)` | `from('journals').insert({ user_id, type, title:'Untitled', content:'' }).select('journal_id, type, title, content, created_at').single()` | On error: `opError = "Couldn't create entry. Please try again."`. On success: prepends the new entry and selects it. |
| **Update** `updateEntry(updated)` | `from('journals').update({ title, content, updated_at: new Date().toISOString() }).eq('journal_id', updated.id)` | **Optimistic**: local state updates first; on error it **rolls back** to the original entry and sets `opError = "Couldn't save changes. Please try again."`. Note the filter is by `journal_id` only — ownership is enforced purely by RLS. |
| **Delete** `deleteEntry()` | `from('journals').delete().eq('journal_id', activeId)` | On error: `opError = "Couldn't delete entry. Please try again."` and abort. On success: removes it locally and selects `remaining[0]?.id ?? ''`. |

`type` is written and read on every operation. **`is_public` is never set here**, so notebook-created entries default to `false` (private), unlike letters saved from `/explore`.

#### Layout (signed in) — **breaks out of `PageWrapper`**
Root: `flex h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f2ede3]` — a fixed-height two-pane app region sized to the viewport minus the 3.5rem navbar. (The global Footer still renders below it, pushed off-screen.)

**Sidebar** (`w-64`, or `w-0 overflow-hidden` when collapsed; 300ms width transition):
1. **Header** — "my notebook" + notebook icon; below it, `loading ? 'loading…' : \`${entries.length} ${entries.length===1?'entry':'entries'}\`` (correct singular/plural).
2. **New-entry controls** —
   - Three tiny type pills: `letter` / `note` / **`win`** (the `accomplishment` type is labeled "win" in this control only) → `setNewType(t)`; selected = solid green.
   - Dashed **"+ New entry"** button → `createEntry(newType)`.
3. **File tree** — `loading` → "Loading entries…". Otherwise, three groups rendered in fixed order, each **hidden entirely when empty**:
   | Group heading | Filters type | Heading color |
   |---|---|---|
   | Letters | `letter` | `#b89a2a` |
   | Accomplishments | `accomplishment` | `#c07a5a` |
   | Notes | `note` | `#5D8E67` |
   Each entry is a button showing its truncated `title`; clicking sets `activeId`. The active entry gets a `#e8e0d0` background and a small `ChevronRight`.
4. **Footer** — "signed in as {displayName}" where `displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'You'`.

**Editor pane:**
- **Sidebar toggle** — small floating button (top-left, `z-20`) → `setSidebarOpen(o => !o)`; the chevron rotates 180° when open.
- **Error banner** — when `opError` is set: peach bar with the message and an **X** button that clears it.
- **When an entry is active** → `<NotebookEditor key={activeEntry.id} …>`:
  - `activeEntry = entries.find(e => e.id === activeId) ?? entries[0]` (falls back to the first entry).
  - **Local editor state:** `localTitle`, `localBody`, `showDelete`. A `useEffect` keyed on `entry.id` resyncs local values when switching entries (and the `key` prop forces a remount anyway).
  - **Top toolbar:** a type badge (colored pill with the type icon + label) and a **Trash2** button (hover turns red) → `setShowDelete(true)`.
  - **Paper area:** 22 spiral rings; a row with `date {entry.date}` (mono) and the `s m t w t f s` strip where the entry's own `dayOfWeek` is bolded; a 20px grid overlay; a **title input** (mono, placeholder `title`); a **20-row body textarea** (Caveat 1.1rem / 1.9, placeholder "Start writing..."); and a subtle `{localBody.length}` character count.
  - **Autosave semantics:** both inputs call `handleBlur` → `onUpdate({...entry, title: localTitle, body: localBody})`. **Saving happens on blur only** — no debounce, no explicit Save button, no Ctrl/Cmd-S, no beforeunload warning. Navigating away with focus still in the textarea loses the edit.
  - **Delete confirmation overlay** (when `showDelete`): a blurred cream scrim (`absolute inset-0 … z-50`) with a white card: "Delete this entry?" / "This can't be undone." / **Cancel** (closes) and **Delete** (red; calls `onDelete()` then closes). No undo.
- **When no entry is active** → an empty-state panel with a pencil icon and copy chosen by state:
  - `loading` → "Loading your entries…"
  - `opError` → "Failed to load entries." + a **"Try again"** button → `loadEntries()`
  - otherwise → "No entries yet." + a **"Write your first letter"** button → `createEntry('letter')`

---

### 3.11 `/before-it-breaks` — BeforeItBreaksPage (`src/pages/BeforeItBreaksPage.tsx`, 226 lines)

**Purpose:** Marketing/preview page for the external "Before It Breaks" simulator with a one-question playable demo. (Reachable only by direct URL — see §1.)

**Local state:** `selected: number | null`, `showInfo: boolean`. **No Supabase.**

**`HealthMeter` sub-component:** spring-animated bar (`useSpring(0, {stiffness:80, damping:18})`, `useEffect` sets the value → the bar animates from 0 on mount and re-animates on every change). Shows label + `value%` above a 2.5px rounded bar.

**Derived stats:** identical formula to the landing widget — `selected !== null ? { social: choice.social, mental: 100 - choice.stress, physical: choice.energy } : { social:70, mental:65, physical:75 }`.

**Sections in order:**
1. **Hero** (fades/slides in on mount, 0.5s) — 2 floating stars + 1 sparkle; the real `Before_It_Breaks_Logo.png` (h-16); pill eyebrow "a Dear Future Me interactive story"; H1 "Before It Breaks" (5xl/6xl); description "Navigate a simulated semester where every choice — classes, sleep, friendships, self-care — shapes your well-being in real time."; handwriting quote *"It doesn't tell you the right answer. It shows you what happens when you choose."*
2. **Game preview** (2-col on `lg`):
   - **Left — game card** (cream, thick green border): a vertical "Dynamic Health Meter" annotation floating outside on `lg`; a legend row (Social peach / Mental yellow / Physical blue); three `HealthMeter`s; the animated `AvatarSlot size="md"` placeholder mascot; the scenario block "Course registration glows on your laptop. / How much are you loading onto this year?"; the three choice buttons → `setSelected(i)` (selected = solid green + `scale-[0.99]`); and, once a choice is made, "Notice how the meters shifted. That's you, on paper."
   - **Right — copy + features + CTAs:**
     - H2 "This isn't about winning school." + paragraph about tradeoffs.
     - **3 feature cards** (stagger 0.1 on scroll, each `y:16 → 0`, 0.4s):
       | Title | Description | Accent |
       |---|---|---|
       | Built from real student data | "Scenarios drawn from 1,109 survey responses about academic pressure, burnout, and what students actually face." | yellow |
       | Dynamic well-being meters | "Watch your social, mental, and physical health respond to every choice in real time." | soft green |
       | Reflection after every choice | "Pause and ask: why did I choose that? What does that say about what I value right now?" | soft blue |
     - `Button primary lg` **"Enter the Semester"** → `openSimulator()` → `window.open(BEFORE_IT_BREAKS_URL, '_blank', 'noopener,noreferrer')`.
     - `Button ghost md` **"How the Game Works"** (HelpCircle icon) → `setShowInfo(!showInfo)` (plain toggle, no animation).
     - **Info block** (only when `showInfo`): "Each semester, you make decisions about classes, sleep, social life, and self-care. The dynamic meter updates in real-time to show how those choices affect your three core health areas. At the end, you see the full picture — and what you might do differently."
3. **Bottom CTA band** (soft green tint, top border): H3 "Ready to see your semester?", handwriting "The game is not here to judge you. It's here to help you notice.", and another `Button primary lg` **"Enter the Semester"** → `openSimulator()`.

---

## 4. Auth Flows — exactly as implemented

`src/context/AuthContext.tsx` (89 lines). Provider is mounted **outside** `BrowserRouter`, so it cannot use router hooks.

**Context value:** `{ user: User|null, session: Session|null, loading: boolean, signUp, signIn, signInWithGoogle, signOut, login, logout }`. Default context object has `loading: true` and no-op functions.

**Session bootstrap + persistence** (`useEffect` on `[]`):
1. `supabase.auth.getSession()` → sets `session`, `user = session?.user ?? null`, `loading = false`.
2. Subscribes to `supabase.auth.onAuthStateChange((_event, session) => { setSession; setUser; setLoading(false) })`.
3. Cleanup: `subscription.unsubscribe()`.
- Persistence is whatever `createClient` defaults to (localStorage, auto-refresh) — **no custom storage/persistence options are passed**. Sessions therefore survive reloads and tabs.
- `loading` is exposed but **no component reads it**, hence the auth-state flash in the Navbar and on `/notebook` (the signed-out gate can render for a split second before the session resolves).

**Methods:**
| Method | Implementation |
|---|---|
| `signUp(email, password, name)` | `supabase.auth.signUp({ email, password, options: { data: { name } } })` → returns `{data, error}`. The `name` lands in `user_metadata.name`, which the DB trigger `handle_new_user()` copies into `profiles.name`. |
| `signIn(email, password)` | `supabase.auth.signInWithPassword({ email, password })` → `{data, error}` |
| `signInWithGoogle()` | `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/notebook` } })` |
| `signOut()` | `await supabase.auth.signOut()` — returns void, **errors are swallowed**. |
| `login()` | **Dead code** — empty function. Comment says "kept as aliases so Navbar compiles until step 5 replaces them"; step 5 shipped and Navbar no longer uses it. |
| `logout()` | **Dead code** — calls `signOut()` without awaiting. Unused. |

**Flow summaries:**
- **Sign up:** form → `signUp` → error shown raw, or `navigate('/notebook')`. Profile row auto-created server-side by trigger. No email-confirmation handling.
- **Sign in:** form → `signIn` → error shown raw, or `navigate('/notebook')`.
- **Google:** either auth page → full-page OAuth redirect → returns to `${origin}/notebook`.
- **Sign out:** only from the Navbar (desktop or mobile) → `await signOut()` → `navigate('/')`.
- **Protected-route behavior:** there is none in the router. `/notebook` renders a sign-in prompt in place of its content. All other pages are fully usable signed-out. The only other auth branch in the app is `ExplorePage > LetterSection`, which pushes the user to `/sign-in` on save attempt (discarding the draft).
- **No password reset, no email verification UI, no account deletion, no profile editing, no session-expiry messaging.**

---

## 5. Backend / Data

### 5.1 Supabase client — `src/supabase/client.ts`
```ts
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```
Default export, no options object, no typed `Database` generic, **no guard for missing env vars** (a missing `VITE_SUPABASE_URL` throws at client construction and blanks the app). Env vars required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

### 5.2 Tables the current frontend actually uses
| Table | Used by | Ops |
|---|---|---|
| `journals` | MyNotebookPage, ExplorePage (LetterSection) | SELECT / INSERT / UPDATE / DELETE |
| `testimonials` | StoriesPage, LandingPage | SELECT (approved), INSERT (unapproved) |
| `feedback` | FeedbackPage | INSERT |
| `auth.users` | AuthContext | signUp / signIn / OAuth / signOut |
| RPC `count_community_letters` | ExplorePage | `.rpc()` |

### 5.3 Full schema from `supabase/migrations/*.sql` (12 files, chronological)

**`20250502040002_small_palace.sql` — initial schema**
- `accomplishments(id uuid PK default gen_random_uuid(), text text NOT NULL, created_at timestamptz default now())`
- `letters(id uuid PK, text text NOT NULL, created_at timestamptz)`
- `vision_boards(id uuid PK, icons jsonb NOT NULL, created_at timestamptz)`
- RLS enabled on all three; policies: "Anyone can read \<table\>" (SELECT, anon+authenticated, `USING true`) and "Anyone can insert \<table\>" (INSERT, anon+authenticated, `WITH CHECK true`).

**`20250502144732_copper_grass.sql`** — re-declares the same three tables with `CREATE TABLE IF NOT EXISTS`, this time defining `accomplishments` with `content text NOT NULL` and `session_id text REFERENCES sessions(session_id)`. Because of `IF NOT EXISTS` the earlier table wins on a fresh run; **and it references a `sessions` table that no migration ever creates** — this migration is internally inconsistent. Same policies re-created.

**`20250502145028_rapid_boat.sql`**
- Creates `check_profanity()` — a `BEFORE INSERT` trigger function that raises `'Content contains inappropriate language'` if `NEW.content` matches any of a 21-word blocklist (`fuck, shit, ass, bitch, dick, pussy, cock, cunt, bastard, whore, slut, piss, nigger, faggot, retard, damn, hell, penis, vagina, boob, tit`) on Postgres word boundaries (`\m…\M`, case-insensitive).
- `ALTER TABLE accomplishments ADD COLUMN IF NOT EXISTS delete_key text`.
- Trigger `check_profanity_trigger BEFORE INSERT ON accomplishments`.
- DELETE policy "Allow deletion with key" `USING (delete_key = current_setting('app.delete_key', true))`.

**`20250504001847_peaceful_summit.sql`** — `public.set_claim(name text, value text)` (`SECURITY DEFINER`, `search_path=public`) → `set_config('app.'||name, value, true)`. Intended to power the delete-key policy above.

**`20250504002022_hidden_scene.sql`** — replaces the accomplishments DELETE policy with `USING (true)`. **Effect: anyone may delete any accomplishment, and `set_claim` becomes vestigial.**

**`20250609040904_sweet_recipe.sql` — the core platform schema**

| Table | Columns |
|---|---|
| `profiles` | `id uuid PK REFERENCES auth.users ON DELETE CASCADE`, `name text`, `email text`, `created_at timestamptz`, `updated_at timestamptz` |
| `journals` | `journal_id uuid PK default gen_random_uuid()`, `user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE`, `entry_date timestamptz default now()`, `title text`, `content text NOT NULL`, `is_public boolean default false`, `created_at timestamptz`, `updated_at timestamptz` |
| `testimonials` | `testimonial_id uuid PK`, `user_id uuid REFERENCES auth.users ON DELETE SET NULL`, `testimonial_content text NOT NULL`, `author_name text`, `is_approved boolean default false`, `created_at timestamptz` |
| `feedback` | `feedback_id uuid PK`, `submitted_at timestamptz default now()`, `feedback_content text NOT NULL`, `category text default 'general'`, `email text` |
| `letter_counts` | `id uuid PK`, `copy_count integer default 0`, `created_at`, `updated_at` (seeded with one row, `copy_count = 0`) |

RLS policies:
- **profiles** — SELECT/UPDATE/INSERT for `authenticated` where `auth.uid() = id`.
- **journals** — "Users can view own journals" (SELECT, authenticated, `auth.uid() = user_id`); **"Users can view public journals" (SELECT, authenticated + anon, `is_public = true`)**; INSERT/UPDATE/DELETE for authenticated where `auth.uid() = user_id`.
- **testimonials** — "Anyone can view approved testimonials" (SELECT, anon+auth, `is_approved = true`); "Users can insert testimonials" (INSERT, anon+auth, `WITH CHECK true`); "Users can view own testimonials" (SELECT, authenticated, `auth.uid() = user_id`).
- **feedback** — INSERT only (anon+auth, `WITH CHECK true`). **No SELECT policy → write-only from the client.**
- **letter_counts** — SELECT and UPDATE for anon+authenticated, `USING true`.

Functions/triggers:
- `handle_new_user()` (`SECURITY DEFINER`) inserts `(id, raw_user_meta_data->>'name', email)` into `profiles`; trigger `on_auth_user_created AFTER INSERT ON auth.users`.
- `increment_letter_count()` (`SECURITY DEFINER`) — `UPDATE letter_counts SET copy_count = copy_count+1, updated_at = now()` on the first row. **Never called by the current frontend.**

**`20250609042417_rustic_pine.sql`** — adds `letters.user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE` (nullable). Rewrites letters policies: INSERT anyone; "Users can read own letters" (`auth.uid() = user_id`); "Anyone can read anonymous letters" (`user_id IS NULL`).

**`20250609044844_lucky_sea.sql`** — sets `letter_counts.copy_count = 56` (via an `ON CONFLICT` insert plus a DO block).

**`20250609045142_floating_bread.sql`** — re-creates `letter_counts` policies to add INSERT for anon+authenticated, and re-adds UPDATE/SELECT.

**`20241126130000_thanksgiving_gratitude.sql`** *(dated Nov 2024 but ordered first alphabetically → **runs before the initial schema** on a fresh `supabase db reset`; it is self-contained so it still applies)*
- `thanksgiving_gratitude(id uuid PK, content text NOT NULL, delete_key text, created_at timestamptz default timezone('utc', now()))`
- RLS: read / insert / **delete all `USING true`** for anon+authenticated (the "delete key" is not actually enforced).
- Re-declares `check_profanity()` and attaches `check_profanity_thanksgiving BEFORE INSERT`.

**`20250903045138_flat_truth.sql`** — `UPDATE testimonials SET is_approved = true WHERE is_approved = false` (one-time backfill; header comment claims "new testimonials will be auto-approved in the application code" — **the current StoriesPage does the opposite and inserts `is_approved: false`**).

**`20250903045411_graceful_torch.sql`** — seeds **11 approved anonymous testimonials** (`author_name = 'Anonymous'`, `created_at` staggered `now() - interval '1..15 days'`). These are what currently populate `/stories` and the landing-page community wall. Full texts are in the migration; themes: talking to a counselor, the accomplishments board, slowing down, stress awareness, the letter-writing activity, coping strategies, asking for help, the vision board, GPA not defining you, mental health vs. academics, and "I could breathe again".

### 5.4 Schema drift — columns the code uses that **no migration defines**
> These must have been applied directly in the Supabase dashboard. A rebuild that replays only these migrations will break.

| Used in code | Missing from migrations |
|---|---|
| `journals.type` (`'letter' \| 'note' \| 'accomplishment'`) — written by `createEntry` and `LetterSection`, selected by `loadEntries` | The `journals` table has **no `type` column** in any migration. |
| `testimonials.tags` (`text[]`, selected by StoriesPage) | The `testimonials` table has **no `tags` column** in any migration. StoriesPage defensively does `Array.isArray(row.tags) ? … : []`, so it degrades to empty tag lists rather than crashing on the mapping — but the `select` itself would error on a strict schema. |
| RPC `count_community_letters()` | **No migration creates this function.** `MIGRATION_PLAN.md` §3.3 specifies it over a `notebook_entries` table that was never created; the shipped version (whatever exists in the project) must count `journals`. ExplorePage handles its absence by falling back to `650`. |

### 5.5 Tables/functions that exist but are **unused by the current frontend**
`accomplishments` (written only by the cron job below), `letters`, `vision_boards`, `thanksgiving_gratitude`, `letter_counts`, `profiles` (written only by the signup trigger; never read or edited in the UI), `set_claim()`, `increment_letter_count()`, `sessions` (referenced but never created).

### 5.6 Cron / API jobs

**`api/cron/seed-accomplishments.js`** + `vercel.json`:
```json
{ "crons": [ { "path": "/api/cron/seed-accomplishments", "schedule": "0 0 * * *" } ] }
```
- Vercel serverless handler, **GET only** (405 with `Allow: GET` otherwise).
- Env: `SUPABASE_URL || VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || VITE_SUPABASE_ANON_KEY`; returns 500 with a `requiredAnyOf` list if missing. Client created with `auth: { persistSession: false }`.
- Generates **100 deterministic sample accomplishments** via a `mulberry32` PRNG seeded with `0xdefa17`, from 8 sentence templates composed of `starters` × `verbs` × `smallWins` / `kindness` / `growth` × `contexts` fragment banks. Post-processing: collapse whitespace, capitalize, append a period, reject if length < 18 or > 260, reject on a duplicated string, reject if it contains a banned word (the list is duplicated in JS to mirror the DB trigger). Throws if it can't reach 100 unique entries within `count * 200` attempts.
- **Idempotency:** each row is prefixed `"Sample: "`. It first counts rows `LIKE 'Sample: %'` created within the current **UTC day**; if any → `{status:'noop', reason:'already_seeded_today'}`. Then it counts all `Sample: ` rows to get `nextIndex`; if `nextIndex >= 100` → `{status:'done'}`. Otherwise it inserts **exactly one** row per day and returns `{status:'seeded', insertedIndex, remaining}`.
- Net effect: a drip-feed of one fake accomplishment per day for 100 days into the `accomplishments` table — **which no page in the current app reads.** This is legacy/orphaned behavior relative to the current UI.

**Supabase Edge Functions** (`supabase/functions/`, Deno; neither is invoked from `src/`):
- **`send-email`** — `Deno.serve`, CORS-open (`*`). Body `{ email, letterContent }`. Sends via **Resend** (`RESEND_API_KEY`) from `Dear Future Me <noreply@resend.dev>`, subject "Your Letter to Future Self", with the letter body (newlines → `<br>`) in an HTML template. 400 on error.
- **`send-weekly-reminders`** — uses the service-role key. Refuses unless the server clock says **Friday (`getDay()===5`) at hour 15**, returning `{success:false, message}` otherwise. Queries `profiles` for `phone, name` WHERE `phone IS NOT NULL AND notifications_enabled = true`, picks a random message from a bank of **10** reminder strings, and… **the Twilio call is entirely commented out** — no SMS is actually sent. Note it reads `profiles.phone` and `profiles.notifications_enabled`, **neither of which exists in any migration** (more schema drift; `AUDIT.md` claims they were added by a later migration that is not in this repo).

---

## 6. Game Mechanics — "Before It Breaks"

**Data** (`src/data/index.ts`, `gameChoices`) — three options for a single course-load question:
| Label | `stress` | `energy` | `social` |
|---|---|---|---|
| 6 AP Classes | 90 | 30 | 40 |
| 3 AP Classes | 55 | 65 | 65 |
| No AP Classes | 25 | 85 | 80 |

**Mapping to the three displayed meters** (identical in all three widgets):
```
Social   = choice.social
Mental   = 100 - choice.stress      ← inverted: high stress ⇒ low mental health
Physical = choice.energy
Unselected default = { social: 70, mental: 65, physical: 75 }
```
Meter colors are fixed: **Social = peach `#FFD1BD`**, **Mental = yellow `#FEE188`**, **Physical = soft blue `#B7E3FF`**.

**Three places the widget appears:**
1. `LandingPage` journey step 3 — compact dark-green card, only Mental + Physical meters, `e.stopPropagation()` on choice clicks, CSS width transition (0.6s ease).
2. `LandingPage` featured section — full three-meter cream card with legend + scenario text, same shared `gameChoice` state as (1).
3. `BeforeItBreaksPage` — three-meter card with spring-animated meters (`useSpring` 80/18, animating up from 0 on mount) plus the `AvatarSlot` mascot.

**Scenario copy (verbatim, in 2 and 3):** "Course registration glows on your laptop. / How much are you loading onto this year?" Landing widget (1) uses the shorter "How many APs are you taking?"
**Post-choice feedback:** "Notice how the meters shifted. That's you, on paper."

**Embedded vs. linked:** the in-app widget is a **single-question, non-scoring demo only** — no progression, no semester loop, no persistence, no end state. Every "Enter the Semester" / "Open Simulator" CTA opens the **external** game at `https://before-it-breaks.vercel.app/` in a new tab (`_blank`, `noopener,noreferrer`). Nothing is embedded via iframe, and nothing about the choice is stored or sent anywhere.

---

## 7. External Integrations

| Integration | Where | Details |
|---|---|---|
| **QuestionPro pre-survey** | `CheckInPage` primary CTA | `PRE_SURVEY_URL = https://neurohealthalliance.questionpro.com/t/AbYLCZ6Dsf` — `window.open(..., '_blank', 'noopener,noreferrer')`. Completion is not tracked. |
| **QuestionPro post-survey** | `CheckOutPage` primary CTA | `POST_SURVEY_URL = https://neurohealthalliance.questionpro.com/t/AbYLCZ6DtH` — same mechanism. |
| **Before It Breaks game** | Navbar (desktop + mobile), LandingPage (2 CTAs), BeforeItBreaksPage (2 CTAs), ActivityCard (dead) | `BEFORE_IT_BREAKS_URL = https://before-it-breaks.vercel.app/`, always new tab. |
| **Padlet (embedded)** | ExplorePage → Vision Board | `<iframe src="https://padlet.com/embed/az8l0z5n3ovuib6a" allow="camera;microphone;geolocation">`, 480px tall. |
| **Padlet (link out)** | ExplorePage → Vision Board | `https://padlet.com/suhani3/dear-future-me-az8l0z5n3ovuib6a`, new tab. |
| **Google Slides** | ExplorePage instructions | `https://slides.new`, new tab. |
| **Canva** | ExplorePage instructions | `https://canva.com`, new tab. |
| **Google OAuth** | SignIn + SignUp | Supabase `signInWithOAuth({provider:'google'})`, `redirectTo: ${origin}/notebook`. |
| **placehold.co** | AboutPage | Fallback team-photo URLs when a `src/assets/team/` file is missing. Currently unused (all 7 members have assets). |
| **Google Fonts** | `index.html` | Comfortaa, Caveat, Playfair Display (italic), with preconnects. |
| **Resend** | `supabase/functions/send-email` | Not called by the app. |
| **NeuroHealth Alliance** | Footer (twice: logo column + bottom bar) and AboutPage final section | Partner attribution, real logo `src/assets/partners/NHA_logo.png`. Also the survey host domain. **Not a link** anywhere — text/logo only. |
| **Twilio** | `send-weekly-reminders` | Commented-out stub. Not integrated. |

---

## 8. Shared Data Constants (`src/data/index.ts`) — exact field names

| Export | Shape | Used? |
|---|---|---|
| `BEFORE_IT_BREAKS_URL` | string | ✅ Navbar, LandingPage, BeforeItBreaksPage, ActivityCard |
| `PRE_SURVEY_URL` / `POST_SURVEY_URL` | string | ✅ CheckInPage / CheckOutPage |
| `navLinks` | `{ label, path }[]` — Home `/`, Check In `/check-in`, Explore `/explore`, Check Out `/check-out`, Stories `/stories`, About `/about` | ✅ Navbar (desktop + mobile) |
| `footerLinks` | `...navLinks` + `{ label:'Feedback', path:'/feedback' }` | ✅ Footer |
| `impactStats` | `{ value, label, accent }[]` — 26 schools / 720 attendees / "↓ 3.95→3.32" | ❌ **unused** (landing hardcodes its own receipt) |
| `howItWorksSteps` | `{ number, title, description, icon, accent }[]` — 4 steps (Check in with yourself / Choose what you need / Reflect, write, or play / Leave with perspective) | ❌ **unused** (landing hand-codes 5 steps) |
| `activities` | `{ id, title, prompt, button, icon, accent, moods[] }[]` — 6: `non-resume`, `vision-board`, `letter`, `before-it-breaks`, `gratitude`, `reset` | ❌ **unused** (ExplorePage hand-codes 3) |
| `moodFilters` | `{ id, label }[]` — overwhelmed, behind, burned-out, hopeful, unsure, comparing | ❌ **unused** |
| `storyTags` | `string[]` — Academic pressure, College anxiety, Comparison, Burnout, Family pressure, Small wins, Hope | ❌ **unused** |
| `stories` | `{ id, text, tags[], color, rotation }[]` — 6 samples | ⚠️ **partially used** — LandingPage only, `slice(0,2)` in the Stories portal card and `slice(3,5)` in journey step 4. StoriesPage uses live DB data instead. |
| `timelineItems` | `{ year, label, description }[]` — 6 items, 2023→2026 | ✅ AboutPage |
| `gameChoices` | `{ label, stress, energy, social }[]` — 3 | ✅ LandingPage ×2, BeforeItBreaksPage |

**Unused-activity definitions worth preserving as backlog** (from `activities`): **Gratitude Note** — prompt "Name one small thing that kept you going.", button "Add Note", moods hopeful/unsure/overwhelmed; **Reset Card** — prompt "Take a 60-second pause before moving forward.", button "Start Reset", moods burned-out/overwhelmed/behind. Also `Non-Resume Accomplishments` prompt "What are you proud of that would never fit on an application?", `Vision Board` prompt "What kind of life are you trying to grow toward?", `Letter to Future Self` prompt "Write to the version of you who made it through."

---

## 9. Discrepancies with `AUDIT.md` / `MIGRATION_PLAN.md`

### 9.1 `AUDIT.md` — stale, describes a different (pre-rebuild) app
| AUDIT.md claim | Current reality |
|---|---|
| Routes `/survey`, `/post-survey`, `/explore/*` (nested: `/explore/accomplishments`, `/explore/vision-board`, `/explore/letter`), `/thank-you`, `/testimonials`, `/testimonials/new`, `/thanksgiving`, `/admin`, `/dashboard`, `/journal`, `/surveys`, `/profile` | **None of these exist.** The router has exactly the 11 flat routes in §1. |
| Pages `Welcome`, `Survey`, `Explore`, `Dashboard`, `Journal`, `Surveys`, `Testimonials`, `Profile`, `Admin`, `Exit`, `Thanksgiving`, `AccomplishmentFeed`, `VisionBoard`, `LetterToSelf` | **No such files.** `src/pages/` contains only the 11 components listed in §1. |
| `ProtectedRoute` component wraps `/dashboard`, `/journal`, `/surveys`, `/profile` | **No `ProtectedRoute` exists.** Only `/notebook` is gated, and inline. |
| `AuthModal` overlay component | Replaced by dedicated `/sign-in` and `/sign-up` pages. |
| `ThemeContext` with `darkGreen #1B4332` | **No `ThemeContext` and no such color.** `src/context/` contains only `AuthContext.tsx`. The palette is `#5D8E67` / `#9FD89C` / `#F9F5ED` / `#FEE188` / `#FFD1BD` / `#B7E3FF`. No theming, no dark mode. |
| `/admin` with hardcoded password `admin123`, CSV export | **Does not exist** in this codebase. There is no admin surface and no moderation UI at all (testimonial approval must be done in the Supabase dashboard). |
| Landing reads/writes `letter_counts` (`copy_count`, seeds 56) | **Never touched by the current app.** LandingPage reads `testimonials` instead; the letter count comes from the `count_community_letters` RPC on ExplorePage. |
| Testimonial insert hardcodes `is_approved: true` ("no moderation flow") | **Inverted.** StoriesPage now inserts `is_approved: false` — moderation is required before a story appears. |
| `profiles` has `phone` + `notifications_enabled` columns | Those columns appear in **no migration in this repo** (drift). The `send-weekly-reminders` edge function still queries them. |
| Feedback categories `general / suggestion / bug / support` | Now `liked / confused / wish / story / bug`; no `email` is collected. |
| Surveys open external QuestionPro links from a `Survey` page | Correct in spirit; now split across `CheckInPage` (pre) and `CheckOutPage` (post) with the concrete URLs in §7. |

**Bottom line:** treat `AUDIT.md` as a historical record of the *previous* app. Its **database schema section is still broadly accurate** (it matches the migrations, minus the drift noted in §5.4) — that is the one part worth consulting.

### 9.2 `MIGRATION_PLAN.md` — a plan, now mostly executed but **not as written**
| MIGRATION_PLAN says | Current reality |
|---|---|
| "`/before-it-breaks` … is not registered in the router. That route must be added." (§ note + checklist #15) | **Done** — `App.tsx:34`. But nothing in the UI links to it (all CTAs go external). |
| CheckIn/CheckOut survey buttons are `alert()` stubs (checklist #13) | **Done** — real `window.open` with the QuestionPro URLs. |
| SignIn/SignUp `onSubmit` navigates to `/explore` without auth; Google OAuth missing; wire "Forgot password?" (checklists #3, #4) | Auth **is wired** (Supabase, navigates to `/notebook`) and **Google OAuth exists on both pages**. **"Forgot password?" was never added** — there is no reset-password affordance anywhere. |
| AuthContext is a stub; remove `login`/`logout` aliases (checklist #2) | Auth is real, but the **dead `login`/`logout` aliases were left in place** with an outdated comment. |
| Navbar should read `loading` and hide auth state while loading (checklist #5) | **Not done** — `loading` is exposed but unused anywhere; auth state flashes on first paint. |
| **Create a `notebook_entries` table** as the store for the notebook (§3.1, checklist #6) | **Not done.** No such table and no migration. `MyNotebookPage` uses the **existing `journals` table** with a `type` column that no migration defines. |
| **Create a `stories` table** and seed the 6 static stories (§3.2, checklist #9) | **Not done.** No such table. `StoriesPage` uses the **existing `testimonials` table** (`testimonial_id`, `testimonial_content`, `is_approved`) plus a `tags` column that no migration defines. |
| `count_community_letters()` RPC over `notebook_entries` (§3.3) | The RPC **is called** but **no migration defines it**, and if it exists server-side it must count `journals`, not `notebook_entries`. |
| `NonResumeSection` should INSERT `type='accomplishment'` when logged in (checklist #8) | **Not done.** Still local state only, never persisted, for every user. |
| `CheckOutPage` reflection should optionally INSERT `type='note'` (checklist #14) | **Not done.** Still local state only. |
| MyNotebookPage should have a loading spinner and remove SEED fallback (checklist #6) | SEED data is gone and a text loading state exists ("Loading entries…" / "loading…"); there is **no spinner**, and there is now an optimistic-update-with-rollback pattern the plan never described. |
| LandingPage community wall should read live approved stories (checklist #11) | **Done**, but against `testimonials` — and only the sticky-note wall. The Stories portal card and journey-step-4 margin notes **still render static `data.stories`**. |
| LandingPage impact receipt "recommend keeping hardcoded" (#12) | Still hardcoded (26 / 720 / 3.95→3.32) — as recommended. |
| Add a `/profile` page wired to `profiles` (checklist #16) | **Not done.** No `/profile` route, no profile UI, no way to edit name/email/phone/notification preferences. |
| Mood filters + Gratitude Note + Reset Card "not yet wired" | **Still not wired.** `moodFilters`, `activities` (6), `storyTags`, `howItWorksSteps`, `impactStats` remain unused; `FilterChip`, `ActivityCard`, `StatCard`, `IllustrationSlot` are dead components. |
| Feedback should INSERT into `feedback` (#10) | **Done**, with loading + error states. |
| Explore letter save (#7) | **Done**, but writes to `journals` with **`is_public: true`** — a public-visibility decision the plan never specified (see §3.3 privacy note). |
| AboutPage team photos are "placeholder circles labeled Add Photo Here"; team is "3 co-founders + 2 team members + 1 placeholder" | **Stale.** AboutPage now has **3 co-founders + 4 team members**, all with real professional + childhood photos loaded via `import.meta.glob`. |

---

## 10. Known Gaps, Dead Code, and Rough Edges (carry-forward list)

- **No 404 route.** Unmatched URLs render an empty shell.
- **No `/profile`**, no account settings, no password reset, no account deletion, no email-verification handling.
- **No moderation UI.** `testimonials.is_approved` must be flipped manually in Supabase.
- **Non-Resume Accomplishments and the Check-Out reflection are never persisted** — users can lose work with no warning.
- **Letter drafts are discarded** when a signed-out user clicks "Sign in to save" (redirect wipes state).
- **Notebook autosave is blur-only** — no debounce, no Save button, no unload guard.
- **Letters saved from `/explore` are `is_public: true`** and therefore anon-readable; letters created in `/notebook` are private. Inconsistent and probably unintended.
- **Schema drift**: `journals.type`, `testimonials.tags`, `profiles.phone`, `profiles.notifications_enabled`, and the `count_community_letters()` RPC exist in code but in no migration. A `sessions` table is FK-referenced but never created.
- **Dead components:** `ActivityCard`, `FilterChip`, `StatCard`, `IllustrationSlot`. **Dead context methods:** `login`, `logout`. **Dead context value:** `loading` (exposed, never consumed). **Dead Button variant:** `game`.
- **Dead/orphaned backend:** `accomplishments` (fed daily by the Vercel cron but read by nothing), `letters`, `vision_boards`, `thanksgiving_gratitude`, `letter_counts`, `increment_letter_count()`, `set_claim()`, both Supabase Edge Functions.
- **Auth-state flash** on every page load because `loading` is ignored.
- **Silent failures:** LandingPage testimonial fetch, ExplorePage RPC, and `signOut` all fail without any user-visible message.
- **Favicon is still `/vite.svg`.**
- `AvatarSlot` is still an SVG placeholder with a TODO; `src/assets/illustrations/` is empty.
- No tests of any kind; no error boundary; no analytics.

---

## 11. Master Feature Checklist

*(One line per distinct capability, for diffing against a new app spec.)*

**Routing & shell**
- Client-side routing with 11 flat routes: `/`, `/check-in`, `/explore`, `/check-out`, `/stories`, `/about`, `/feedback`, `/sign-in`, `/sign-up`, `/notebook`, `/before-it-breaks`
- Persistent app shell: sticky translucent Navbar + global Footer wrapping every route
- Global reduced-motion support (`MotionConfig reducedMotion="user"` + CSS media query killing float/sparkle animations)
- Cream/grid-paper page background applied by a shared `PageWrapper`
- Handwriting (Caveat) + rounded sans (Comfortaa) dual-typeface system with a "paper/desk" visual language
- No 404 route; no route-level auth redirects

**Navigation**
- Logo button returning to home
- Six primary nav links with active-state pills and animated hover underlines
- External "Before It Breaks" nav link opening the game in a new tab
- Auth-conditional navbar: signed-in shows display name + "My Notebook" + "Log out"; signed-out shows "Sign In" + "Sign Up"
- Mobile hamburger menu mirroring all nav + auth actions, auto-closing on selection
- Footer page directory (nav links + Feedback) and NeuroHealth Alliance partner attribution with logo

**Landing page**
- Hero "open letter" card styled as ruled notebook paper with hole punches, margin line, and hand-drawn SVG underline
- Primary CTA "Start Reflection" → `/check-in`; secondary text link "Explore activities" → `/explore`
- Keyboard-accessible "Check In" portal card (click or Enter) with a 5-segment "2 min" duration strip
- Keyboard-accessible "Stories" portal card previewing 2 static student stories
- Animated count-up impact receipt: 26 schools, 720 workshop attendees, anxiety 3.95 → 3.32
- Decorative floating stars/sparkles/blurred blobs with float and sparkle animations
- Cluster of three hardcoded rotated sticky notes with hand-drawn arrow annotation
- Five-step "A path, not a checklist" journey with a vertical SVG connector and per-step CTAs (`/check-in`, `/explore`, in-page scroll, `/stories`, `/check-out`)
- Inline mini Before It Breaks widget inside journey step 3 (2 meters)
- Featured dark-green Before It Breaks section with a 3-meter interactive widget and two external CTAs
- Shared game-choice state between both landing widgets
- Live community notes wall built from the 6 newest approved testimonials, laid out as a scattered sticky-note/folded-letter collage
- "Read all stories" link with hover arrow motion
- Final asymmetric CTA: "Start Your Reflection" + "Create a free account to save your work"
- Reveal-on-scroll (`whileInView`, once) for the journey, game, and community sections

**Check-in flow**
- Step-1 framing with logo, eyebrow pill, and non-clinical copy
- External QuestionPro pre-survey launch in a new tab
- "I Finished, Continue" honor-system advance to `/explore`
- Privacy assurance card with 4 bullets (anonymity, no scoring, 1,109-student data basis, skippable)
- "Skip for now and explore activities" bypass link

**Explore / activities**
- Single-open accordion of three activities with animated height expansion and staggered entrance
- Letter activity open by default
- Live community letter count via `count_community_letters` RPC with a 650 fallback
- Non-Resume Accomplishments writing surface (notebook shell, spiral rings, date + weekday strip, grid paper, 8-row Caveat textarea)
- Non-Resume save → read-only saved card with an "Edit" toggle (local only, not persisted)
- Vision Board instructions with a Google Slides / Canva toggle (5 vs. 4 numbered steps) and external tool links
- Embedded Padlet community vision-board wall (iframe, 480px) plus an "open in new tab" link
- Letter to Future Self composer: title input, 14-row Caveat body, live character count, notebook-paper styling
- Auth-conditional letter save button label ("Save letter" vs. "Sign in to save")
- Letter save → `journals` insert with `type='letter'`, `is_public=true`, title defaulting to "Untitled"
- Guest letter save redirects to `/sign-in`
- Letter save error message and success view with "Edit letter" + "View all my letters" actions
- Persistent "View my saved letters" link to `/notebook`

**Check-out flow**
- "How do you feel now?" closing prompt with sparkle animation
- External QuestionPro post-survey launch in a new tab
- "Finish Journey" completion action
- Optional private takeaway textarea ("One thing I want to remember is…", explicitly not shared, not persisted)
- "Save & Finish" completion action (no validation)
- Completion screen with check badge, anxiety-drop stat, echo of the takeaway note, and "Back to Home" / "Read Community Stories" actions

**Stories / community**
- Live grid of all approved testimonials from Supabase, newest first
- Deterministic index-based color (4 variants) and rotation (6 variants) assignment for sticky-note cards
- Tag pills per story (from a `tags` array, when present)
- Staggered fade-up entrance and hover-lift on story cards
- Loading state, empty state ("No stories yet — be the first to share"), and error state with a working "Try again" retry
- Anonymous story submission form styled as a taped sticky note with a folded corner
- Submission inserts with `is_approved: false` (moderation-gated), no user id, no name, no tags
- Submit disabled until non-empty; submit error message; permanent thank-you success state
- Privacy footnote about review and no identifying information

**About**
- Mission header and founders origin-story card
- Prominent 3.95 → 3.32 anxiety statistic card
- Team bios: 3 co-founders + 4 team members with full personal bios
- Dual-photo "professional + childhood" stacked portrait treatment per member
- Automatic team-photo resolution via `import.meta.glob` on `Name_Professional` / `Name_Little` filenames, with remote placeholder fallback
- Staggered card entrance animations for both team grids
- "Why Dear Future Me exists" narrative card with pull-quote
- Four reach stats (1,109 / 989 / 720 / 26) with sub-captions
- Four belief cards with icons
- Five "what the platform does" capability bullets
- Six-item 2023–2026 timeline with alternating left/right reveal animations
- NeuroHealth Alliance collaboration section with logo

**Feedback**
- Five feedback categories (liked / confused / wish / story / bug) as selectable pills
- Category switch recolors the form card and swaps the textarea placeholder, and clears the draft + error
- Ruled-paper Caveat textarea
- Submit writes `{ feedback_content, category }` to Supabase `feedback`
- Loading state ("Sending…"), disabled-until-non-empty, and error message
- Full-page thank-you screen with "Submit Another" reset (keeps category)

**Auth**
- Email + password sign-up with optional display name (stored in `user_metadata.name`), `minLength=6` password
- Email + password sign-in
- Google OAuth sign-in from both auth pages, redirecting to `${origin}/notebook`
- Show/hide password toggle on both auth pages
- Raw Supabase error messages surfaced in a red banner
- Loading button states ("Signing in…", "Creating account…")
- Post-auth redirect to `/notebook`
- "Continue as Guest" escape hatch to `/explore` on both auth pages
- Cross-links between sign-in and sign-up
- Session bootstrap via `getSession()` plus live `onAuthStateChange` subscription (persists across reloads/tabs)
- Sign-out from Navbar (desktop + mobile) returning to `/`
- Auto-creation of a `profiles` row on signup via DB trigger
- Inline (non-redirecting) auth gate on `/notebook` with a "Sign in to continue" CTA
- *(Absent: password reset, email-verification UI, remember-me, redirect-to-intended-page, profile editing)*

**Notebook (authenticated workspace)**
- Full-height two-pane IDE-style layout (sidebar + editor) sized to viewport minus navbar
- Collapsible sidebar with an animated chevron toggle
- Entry count with correct singular/plural
- Three entry types — letter, note, accomplishment (labeled "win" in the creator) — each with its own icon and color
- New-entry type selector + "New entry" creation (inserts "Untitled" with empty body, prepends and selects it)
- File-tree grouping by type (Letters, Accomplishments, Notes), empty groups hidden, titles truncated, active row highlighted
- "signed in as {name}" footer using metadata name or email local-part
- Grid-paper editor with spiral binding, entry date, weekday strip, title input, 20-row Caveat body, and character count
- Type badge in the editor toolbar
- Blur-triggered autosave of title and body with optimistic local update and rollback on failure
- Delete with a blurred confirmation overlay ("This can't be undone") and Cancel/Delete
- Dismissible error banner for load/create/update/delete failures
- Empty state with "Write your first letter", and an error state with "Try again" reload
- Entries loaded newest-first, scoped by `user_id`, with the newest auto-selected

**Before It Breaks (game)**
- External simulator at `https://before-it-breaks.vercel.app/` opened in a new tab from 5 places
- Dedicated marketing page (route registered, but unlinked from the UI)
- Single-question demo: "How much are you loading onto this year?" with 3 AP-load choices
- Stat model: 6 APs (stress 90 / energy 30 / social 40), 3 APs (55 / 65 / 65), No APs (25 / 85 / 80)
- Three well-being meters — Social, Mental (inverted stress), Physical — with fixed color coding and default 70/65/75
- Spring-animated meter fills on the dedicated page; CSS-transition fills on the landing page
- Post-choice reflective caption ("Notice how the meters shifted. That's you, on paper.")
- Animated mascot avatar placeholder
- Three feature cards (real student data / dynamic meters / reflection after every choice) with staggered reveal
- Toggleable "How the Game Works" explainer
- Bottom CTA band with a second "Enter the Semester"
- No scoring, progression, persistence, or end state in-app

**Backend / data**
- Supabase JS client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `journals` table backing all notebook entries and explore letters (RLS: own rows + public rows readable by anon)
- `testimonials` table backing stories and the landing wall (RLS: approved readable by anyone, anyone may insert)
- `feedback` table, insert-only from the client (no SELECT policy)
- `profiles` table auto-populated by the `handle_new_user` trigger
- Postgres profanity-filter trigger on `accomplishments` and `thanksgiving_gratitude` (21-word blocklist, word-boundary matched)
- 11 seeded approved testimonials as launch content
- Daily Vercel cron (`0 0 * * *`) inserting one deterministic "Sample: " accomplishment per UTC day, up to 100, with idempotency checks
- Legacy tables retained but unused by the UI: `accomplishments`, `letters`, `vision_boards`, `thanksgiving_gratitude`, `letter_counts`
- Legacy Supabase Edge Functions, uninvoked: `send-email` (Resend letter delivery) and `send-weekly-reminders` (Friday-3pm gate, `profiles` query, Twilio commented out)

**External integrations**
- QuestionPro pre-reflection survey (NeuroHealth Alliance host)
- QuestionPro post-reflection survey
- Before It Breaks external game
- Padlet community vision-board (embedded iframe + external link)
- Google Slides and Canva how-to links
- Google OAuth via Supabase
- Google Fonts (Comfortaa, Caveat, Playfair Display)
- placehold.co fallback team portraits
- NeuroHealth Alliance partner branding (footer ×2, about page)
