# Dear Future Me — Design System

> **Source of truth.** Every value in this document was read directly from the current source tree
> (`tailwind.config.js`, `src/index.css`, `index.html`, `src/components/**`, `src/pages/**`,
> `src/assets/**`). If anything here disagrees with `AUDIT.md`, this document wins — `AUDIT.md`
> describes a stale earlier version of the app and should be ignored.
>
> **Purpose.** This is a build-ready spec for a sibling application that should look and feel like a
> member of the same family. It covers brand, color, type, spacing, radius, shadow, motion, texture,
> iconography, imagery, and the full component catalog.

**Stack context:** React 18 + Vite 5 + TypeScript 5 + Tailwind CSS 3.4, `framer-motion` ^11,
`lucide-react` ^0.344, `react-router-dom` ^7. No component library, no CSS-in-JS. All styling is
Tailwind utility classes written inline, with a small set of custom utilities in `src/index.css`.

---

## Table of Contents

1. [Brand Identity & Visual Personality](#1-brand-identity--visual-personality)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout Rhythm](#4-spacing--layout-rhythm)
5. [Border Radius](#5-border-radius)
6. [Elevation & Shadows](#6-elevation--shadows)
7. [Background Textures & Paper Effects](#7-background-textures--paper-effects)
8. [Motion System](#8-motion-system)
9. [Iconography](#9-iconography)
10. [Imagery & Asset Inventory](#10-imagery--asset-inventory)
11. [Component Catalog — `src/components/ui`](#11-component-catalog--srccomponentsui)
12. [Layout Catalog — `src/components/layout`](#12-layout-catalog--srccomponentslayout)
13. [Recurring Page-Level Patterns](#13-recurring-page-level-patterns)
14. [Accessibility & Focus](#14-accessibility--focus)
15. [Scrollbar](#15-scrollbar)
16. [Known Quirks, Unused Tokens & Gotchas](#16-known-quirks-unused-tokens--gotchas)
17. [Quick-Start Checklist for a Sibling App](#17-quick-start-checklist-for-a-sibling-app)

---

## 1. Brand Identity & Visual Personality

**Dear Future Me** is a student mental-wellness and reflection platform. The design language is
deliberately **anti-clinical** and **anti-corporate**: it should read like a well-loved school
notebook left open on a desk, not like a health dashboard.

### The one-line brief

> A warm, cream-paper notebook with a soft green pen, pastel sticky notes, and handwritten margin
> notes — gentle, human, unhurried, and never judgmental.

### Core personality attributes

| Attribute | How it manifests |
|---|---|
| **Warm & papery** | Everything sits on cream `#F9F5ED`, never white. Notebook grid and ruled-line textures show through. Aged-paper edge tones (`#d4c99a`, `#c8b89a`) for "real paper" borders. |
| **Handwritten & personal** | Caveat handwriting font used for quotes, prompts, annotations, and margin labels ("start here", "proof this helped", "you're not the only one →"). |
| **Soft & rounded** | Almost nothing is a sharp rectangle. `rounded-xl` / `rounded-2xl` / `rounded-3xl` / `rounded-full` dominate. Border-radius is the loudest formal signal in the system. |
| **Growth / plant motif** | Green is the primary brand color, the logo is a sprout emerging from an envelope, `Leaf` and `Sparkles` icons recur. Growth, not achievement. |
| **Pastel, low-saturation accents** | Yellow, peach, soft-green, soft-blue — always applied at low opacity (`/15`–`/60`) so nothing shouts. |
| **Scattered / collage** | Sticky notes with CSS `rotate()` between roughly −3deg and +2.5deg, offset margins (`ml-4`, `ml-10 sm:ml-24`), asymmetric section headers. Deliberately not a tidy grid. |
| **Gentle motion** | Slow 6–9s floating stars, 2s sparkle pulses, 4px card lifts. Nothing snappy, nothing bouncy-aggressive. |
| **Quiet authority** | Dark green text at 55–80% opacity rather than pure black. Reduces visual weight and feels softer than high-contrast type. |

### Tone-of-voice notes (drives copy sizing/placement)

- Lowercase handwritten annotations act as *labels* and *asides* ("how it works", "a note from us").
- Sentence-case Comfortaa bold for real headings.
- Reassurance micro-copy appears in small `text-xs` at `/60` opacity ("Anonymous & judgment-free",
  "2 minutes. That's all.").

### Anti-patterns (things this system deliberately avoids)

- Pure white (`#FFFFFF`) surfaces — use cream, or `#FFFDF8` / `#FDFAF3` for a lifted paper.
- Pure black or gray text — all text is green-tinted.
- Hard drop shadows / neutral gray shadows — all shadows are green-tinted and diffuse.
- Dense data tables, sharp corners, high-contrast alerts.
- Fast, springy, attention-grabbing animation.
- There is **no dark mode** in this system.

---

## 2. Color System

### 2.1 Brand palette (from `tailwind.config.js`)

| Token | Tailwind class prefix | Hex | Role |
|---|---|---|---|
| `green.deep` | `green-deep` | `#5D8E67` | **Primary brand color.** All text, all borders, primary button fill, focus rings, icon strokes. The single most-used value in the codebase (~375 occurrences). |
| `green.soft` | `green-soft` | `#9FD89C` | **Secondary / accent green.** Outlines, dividers, tinted surfaces, ghost buttons, scrollbar thumb, dashed placeholder borders. |
| `cream` | `cream` | `#F9F5ED` | **Page & card background.** The default surface. Also the "text on green" color (inverse text). |
| `yellow.soft` | `yellow-soft` | `#FEE188` | Accent 1 — sticky notes, highlight underlines, stars, "My Notebook" nav state, warm CTA. |
| `peach` | `peach` | `#FFD1BD` | Accent 2 — sticky notes, "Check In" step card, heart fill, notebook margin rule. |
| `blue.soft` | `blue-soft` | `#B7E3FF` | Accent 3 — sticky notes, "Stories"/community step card, "physical" meter bar. |

> ⚠️ **Important:** the codebase almost never uses the Tailwind token classes (`bg-cream`,
> `text-green-deep`). It uses **arbitrary-value hex classes** — `bg-[#F9F5ED]`, `text-[#5D8E67]`,
> `border-[#9FD89C]`. Both work; the hex form is the established convention and you'll see it in
> every component. Pick one convention for the sibling app and be consistent.

### 2.2 Extended / derived colors (used inline, not tokenized)

| Hex | Where used | Purpose |
|---|---|---|
| `#3a5c42` | `body` color in `src/index.css`; `StoryCard` quote text; handwritten sticky-note text | **Default body text.** Deeper, softer green than `#5D8E67`. Used specifically for handwriting so Caveat reads solidly. |
| `#2d4a35` | `ExplorePage`, `MyNotebookPage` textarea/journal text | Darkest green — user-authored journal text on paper surfaces. |
| `#4a7254` | `Button` primary hover (`hover:bg-[#4a7254]`), Navbar Sign-Up hover | Primary green hover/pressed state. |
| `#4a7255` | `MyNotebookPage`, `ExplorePage` inline button hovers | Near-duplicate of `#4a7254` — see [§16](#16-known-quirks-unused-tokens--gotchas). |
| `#FFFDF8` | `SurveyActionCard` logo badge, `AboutPage` cards | Lifted "brighter paper" — one step above cream. |
| `#FDFAF3` | `LandingPage` open-letter card | Warm off-white notebook page. |
| `#FFFCF6` | `ExplorePage` elevated paper surfaces | Near-white paper. |
| `#faf8f2` | `ExplorePage` journal panel background (inline `style`) | Paper panel. |
| `#f5f1e8` | `MyNotebookPage` sidebar / toolbar chrome | Slightly darker paper — "notebook cover" tone. |
| `#d4c99a` | Card borders on `LandingPage` letter, `AboutPage` team photo frame, receipt | **Aged-paper edge.** Always at `/60` or `/50` opacity. |
| `#c8b89a` | `MyNotebookPage` / `ExplorePage` panel borders | Aged-paper edge, cooler variant. Always `/30`–`/60`. |
| `#9b8c72` | Spiral-binding hole rings | Notebook hardware. Used at `/45`. |
| `#e4ddd0` | Spiral-binding hole fill | Notebook hardware. |
| `#e8e0d0`, `#ece8e0`, `#f2ede3` | Misc paper dividers | Paper chrome. |
| `#fad96a` | Landing "Enter the Semester" button hover | Deeper yellow hover. |
| `#E2C96C` | `StoriesPage` submission sticky-note border + folded-corner edge | Deeper yellow — the "edge" of a yellow note. |
| `#FFF4B4` | `StoriesPage` submission note's folded top-right corner fill | Very light yellow wash. |
| `#c07a5a` | `MyNotebookPage` "Accomplishments" filter icon | Terracotta — the only warm non-pastel accent. |

### 2.3 The accent system (`yellow | peach | softgreen | softblue`)

Four components take a shared `accent` / `color` prop with the same four-value union. **The opacity
applied differs per component** — this is intentional (larger surfaces get lower opacity).

| Accent key | Base hex | `IconPlaceholder` bg | `ActivityCard` border / highlight bg | `StatCard` bg + border | `StoryCard` card bg | `StoryCard` tag pill |
|---|---|---|---|---|---|---|
| `yellow` | `#FEE188` | `/30` | `border-[#FEE188]` / `bg-[#FEE188]/20` | `bg-[#FEE188]/50 border-[#FEE188]` | `/60` | solid `#FEE188` |
| `peach` | `#FFD1BD` | `/40` | `border-[#FFD1BD]` / `bg-[#FFD1BD]/20` | `bg-[#FFD1BD]/50 border-[#FFD1BD]` | `/60` | solid `#FFD1BD` |
| `softgreen` | `#9FD89C` | `/30` | `border-[#9FD89C]` / `bg-[#9FD89C]/15` | `bg-[#9FD89C]/30 border-[#9FD89C]` | `/40` | `#9FD89C/60` |
| `softblue` | `#B7E3FF` | `/40` | `border-[#B7E3FF]` / `bg-[#B7E3FF]/20` | `bg-[#B7E3FF]/40 border-[#B7E3FF]` | `/50` | solid `#B7E3FF` |

`softgreen` is the default accent for `IconPlaceholder` and `StatCard`; `yellow` is the default for
`StoryCard`. Peach and blue are consistently the two "cooler"/highest-opacity accents because their
base hues are lighter.

### 2.4 Opacity conventions (the most important convention in this system)

Text color is almost always `#5D8E67` with a slash opacity rather than a different hex. Measured
frequency across `src/`:

| Opacity | Count | Typical use |
|---|---|---|
| `/70` | 29 | Body copy, secondary nav links, footer links |
| `/60` | 29 | Muted body, footer legal, micro-copy |
| `/50` | 22 | Very muted labels, "Step 1" eyebrows |
| `/65` | 15 | Step-card descriptions, inactive nav links |
| `/30` | 14 | Decorative dots, arrow SVG strokes, disabled bars |
| `/40` | 13 | Placeholder-ish text, faded icons |
| `/80` | 9 | Emphasized secondary text (`StatCard` label) |
| `/55` | 8 | Handwritten annotations (`HandwrittenLabel`) |
| `/75`, `/72`, `/78`, `/25`, `/35`, `/20` | 1–7 each | Fine-tuned one-offs |

**Rules of thumb for a sibling app:**

- Full-strength `#5D8E67` → headings and primary interactive text only.
- `/70`–`/80` → body copy.
- `/55`–`/65` → supporting copy, handwritten annotations, inactive states.
- `/40`–`/50` → eyebrows, timestamps, hint text.
- `/20`–`/30` → decorative strokes, dividers, empty progress bars, placeholders.
- Borders: `border-[#9FD89C]/25` (navbar), `/30`, `/40` (footer), `/50`, `/60` — the softer the
  divider's role, the lower the value.
- Green-tinted surface washes: `bg-[#9FD89C]/10` … `/45`.

### 2.5 Inverse (on-green) palette

When a section uses a solid `#5D8E67` background (e.g. the "Before It Breaks" band on the landing
page, the receipt header):

| Role | Value |
|---|---|
| Heading / primary text | `text-[#F9F5ED]` |
| Body text | `text-[#F9F5ED]/75` or `/80` |
| Handwritten accent | `text-[#9FD89C]/70` – `/80` |
| Outline border | `border-[#F9F5ED]/30` |
| Hover wash | `hover:bg-[#F9F5ED]/8` |
| Grid texture overlay | `bg-grid opacity-[0.07]` |
| High-contrast CTA | yellow: `bg-[#FEE188] border-[#FEE188] text-[#5D8E67]`, hover `#fad96a` |

---

## 3. Typography

### 3.1 Load method

Fonts are loaded from Google Fonts via a single stylesheet link in `index.html` (with preconnects):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&family=Caveat:wght@400;500;600;700&family=Playfair+Display:ital@1&display=swap" rel="stylesheet" />
```

Note: **Playfair Display is loaded in italic only** (`ital@1`) — there is no roman/upright cut
available.

### 3.2 Families

| Family | Weights loaded | Tailwind token | Utility class | Role |
|---|---|---|---|---|
| **Comfortaa** | 300, 400, 500, 600, 700 | `font-comfortaa` | — | **Everything structural.** Headings, body copy, buttons, nav, labels, stats. Set as the global `html { font-family }` in `src/index.css`, so it is also the implicit default. |
| **Caveat** | 400, 500, 600, 700 | `font-caveat` (defined, unused) | `.font-handwriting` | **Handwriting.** Quotes, reflection prompts, margin annotations, sticky-note text, journal textareas, taglines. |
| **Playfair Display** | italic only | `font-serif` (defined, unused) | `.font-italic-serif` | Italic serif accent. **Currently unused in any component or page** — it is available but dormant. |

Utility definitions in `src/index.css`:

```css
.font-handwriting { font-family: 'Caveat', cursive; }
.font-italic-serif { font-family: 'Playfair Display', serif; font-style: italic; }
```

Base layer:

```css
html { font-family: 'Comfortaa', sans-serif; scroll-behavior: smooth; }
body { background-color: #F9F5ED; color: #3a5c42; }
* { box-sizing: border-box; }
```

### 3.3 When to use which font

| Content type | Font | Example |
|---|---|---|
| Page `h1`/`h2`/`h3` | Comfortaa **bold** | "You are more than what you're trying to prove." |
| Body paragraphs | Comfortaa regular | Explanatory copy under headings |
| Buttons, chips, nav | Comfortaa **semibold**/medium | "Start Reflection" |
| Stats / numbers | Comfortaa **bold**, `tabular-nums` when counting | `26`, `3.95 → 3.32` |
| Section eyebrows / margin labels | Caveat | "how it works", "start here", "proof this helped" |
| Quotes & testimonials | Caveat | `"I thought everyone else had it figured out."` |
| Reflection prompts on cards | Caveat | `ActivityCard.prompt` |
| Journal / textarea input | Caveat | `MyNotebookPage`, `ExplorePage` |
| Taglines (footer, card descriptions) | Caveat | Footer brand tagline |
| Monospace | `font-mono` (system default) | `MyNotebookPage` date/title field only |

### 3.4 Observed size scale

Measured frequency across `src/pages/`:

| Class | Approx. px | Count | Typical use |
|---|---|---|---|
| `text-[9px]` / `text-[10px]` | 9–10 | many | Uppercase eyebrows (`tracking-wider`/`tracking-widest`), meter labels, "Recommended for you" pill |
| `text-xs` | 12 | 33 | Micro-copy, footer legal, tag pills, inline "Begin →" links |
| `text-[13px]` | 13 | — | Desktop nav links (exact custom size) |
| `text-sm` | 14 | 66 | **Most common.** Body in compact cards, buttons `sm`, footer links, `StatCard` label |
| `text-[15px]` | 15 | — | Landing "Check In" card body |
| `text-base` | 16 | 28 | Default body copy, `Button md` |
| `text-lg` | 18 | 36 | Card `h3`, `Button lg`, handwritten quotes, journal text |
| `text-xl` | 20 | 16 | Large handwritten pull quotes |
| `text-2xl` | 24 | 11 | `SurveyActionCard` title, sub-section headings |
| `text-3xl` | 30 | 16 | `StatCard` value, section `h2` (mobile), `HandwrittenLabel` on landing |
| `text-4xl` | 36 | 12 | Section `h2` at `sm:` and up; landing "Dear Future Me," handwritten salutation |
| `text-5xl` | 48 | 5 | Hero `h2` on colored bands (`sm:text-5xl`) |
| `text-6xl` | 60 | 3 | Largest display moments |
| `text-[2.6rem]` | ~42 | 1 | Landing `h1` at `lg:` |

**Heading pattern (copy this):**

```jsx
// Page/section h2
<h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl">…</h2>

// Hero h1 (landing)
<h1 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl lg:text-[2.6rem] leading-tight mb-5">…</h1>

// Card h3
<h3 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-1">…</h3>

// Handwritten eyebrow
<span className="font-handwriting text-[#5D8E67]/55 text-3xl">how it works</span>
```

### 3.5 Line-height & tracking conventions

| Utility | Where |
|---|---|
| `leading-tight` | Large headings (`h1`, `h2`) |
| `leading-snug` | Handwritten prompts, sticky notes, compact card copy |
| `leading-relaxed` | Body paragraphs, quotes, journal text |
| `leading-none` | Logo wordmark, tight numeric rows |
| `tracking-wide` | Footer column headings (`uppercase text-sm`), landing salutation |
| `tracking-wider` / `tracking-widest` | 9–10px uppercase eyebrows ("STEP 1", "COMMUNITY") |
| `tabular-nums` | Animated counters, stat numbers that change |

### 3.6 Text truncation

```css
.line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.line-clamp-3 { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
```

Hand-rolled in `src/index.css` (this Tailwind 3.4 setup does not rely on the built-in plugin).
Used for story previews on the landing page.

### 3.7 Vertical text

```css
.writing-vertical-lr { writing-mode: vertical-lr; }
```

Used once, on `BeforeItBreaksPage`, combined with `transform rotate-180` to produce a vertical
"Dynamic Health Meter" label alongside the game frame.

---

## 4. Spacing & Layout Rhythm

Standard Tailwind 4px spacing scale. Observed conventions:

### 4.1 Page containers

| Container | Class | Used by |
|---|---|---|
| Navbar / Footer shell | `max-w-7xl mx-auto` | `Navbar` (`px-5 sm:px-8`), `Footer` (`px-4 sm:px-6`) |
| Wide content band | `max-w-6xl mx-auto` | Landing "Before It Breaks" section |
| Standard content | `max-w-5xl mx-auto` | Landing hero + community wall |
| Narrow reading column | `max-w-4xl` / `max-w-3xl` | Journey path, prose sections |
| Card / form | `max-w-2xl`, `max-w-lg` (`SurveyActionCard`) | Forms, modals, focused actions |
| Inline text measure | `max-w-sm` (8×), `max-w-md` (7×), `max-w-xs` | Paragraph line-length control inside cards |

### 4.2 Section padding

- Horizontal: **`px-4 sm:px-6 lg:px-10`** — the canonical page-section padding on landing/pages.
- Vertical: `py-16` (8 uses) and `py-20` (3) are the workhorses; `py-12` (5) for tighter bands;
  `py-24` (3) for the most spacious; `py-8` / `py-10` for the hero (which is intentionally tight so
  content sits high on the page).
- Footer: `py-12`.

### 4.3 Internal spacing

| Context | Padding | Gap |
|---|---|---|
| Standard card | `p-5` or `p-6` | `gap-4` |
| Large feature card | `p-8` (`SurveyActionCard`), `p-8 sm:p-10` | `gap-6` |
| Stat card | `p-5` | — |
| Sticky note | `px-4 py-3` | — |
| Grid of cards | — | `gap-6` (3-col), `gap-8` (footer), `gap-4`/`gap-5` (tight) |
| Journey step list | — | `gap-16` between steps, `gap-6` inside a step row |
| Nav link row | `px-3 py-1.5` | `gap-0.5` |
| Mobile nav item | `px-4 py-2.5` | `gap-0.5` |

### 4.4 Grid breakpoints

Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Observed usage:

| Pattern | Count | Where |
|---|---|---|
| `grid-cols-1` | 8 | Base for every grid |
| `sm:grid-cols-2` | 3 | Team, stats |
| `md:grid-cols-2` / `md:grid-cols-3` | 1 each | Footer (`md:grid-cols-3`) |
| `lg:grid-cols-2` | 2 | Two-column feature splits |
| `lg:grid-cols-3` | 2 | Story grid, activity grid |
| `xl:grid-cols-3` | 1 | Widest card grid |

Canonical card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.

**Navbar breakpoint is `lg` (1024px)** — the desktop nav is `hidden lg:flex`, the hamburger is
`lg:hidden`. This is unusually late; it exists because the nav carries 7 links plus auth controls.

---

## 5. Border Radius

Radius is the loudest formal signal in this system. Nothing is square.

| Class | Value | Count | Use |
|---|---|---|---|
| `rounded-full` | 9999px | 58 | Pills (nav links, chips, tags, badges), dots, avatars, progress bars, step markers |
| `rounded-2xl` | 16px | 38 | **The default card radius.** `ActivityCard`, `StatCard`, `AvatarSlot`, `IllustrationSlot`, step cards, journal panels |
| `rounded-xl` | 12px | 31 | Small cards, `IconPlaceholder` badge, `Button sm`, inline buttons, mobile nav items, `StoryCard` |
| `rounded-lg` | 8px | 11 | Sticky notes, mini previews, tight inline elements |
| `rounded-3xl` | 24px | 8 | Big hero/feature containers — `SurveyActionCard`, landing game widget |
| `rounded-[2rem]` | 32px | 3 | Extra-soft framing — `SurveyActionCard` logo badge, `AboutPage` team photo frame & bio cards |
| `rounded-[1.75rem]` / `rounded-[1.4rem]` | 28 / 22.4px | 1 each | Nested photo frames |
| `rounded-sm` | 2px | 2 | Rare, tiny UI chrome |

**Heuristic:** the bigger the surface, the bigger the radius.
`rounded-lg` (sticky note) → `rounded-xl` (small card) → `rounded-2xl` (standard card) →
`rounded-3xl` / `rounded-[2rem]` (hero panels). Anything pill-shaped is `rounded-full`.

**Button radius is size-linked:** `sm` → `rounded-xl`, `md`/`lg` → `rounded-2xl`.

---

## 6. Elevation & Shadows

All shadows are **green-tinted** (`rgba(93,142,103, …)`) rather than neutral gray. This is a
signature detail — a gray shadow will immediately look "off-brand".

### 6.1 Tokens (`tailwind.config.js`)

| Token | Value | Use |
|---|---|---|
| `shadow-soft` | `0 4px 24px rgba(93,142,103,0.1)` | Primary buttons, `SurveyActionCard` — a gentle ambient lift |
| `shadow-card` | `0 2px 16px rgba(93,142,103,0.12)` | Resting card elevation — `StoryCard`, receipt, inline game card |
| `shadow-card-hover` | `0 8px 32px rgba(93,142,103,0.18)` | **Defined but never used in source** — the `.card-hover` CSS class supplies its own hover shadow instead. |

### 6.2 The `.card-hover` utility (`src/index.css`)

```css
.card-hover {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(93, 142, 103, 0.2);
}
```

This is the **default hover treatment for every non-motion card** in the system — `ActivityCard` and
`StatCard` as authored (both are currently unrendered, see [§11](#11-component-catalog--srccomponentsui)),
plus the sticky notes, step cards and community notes written inline on the pages. Note the hover shadow here
(`0 12px 36px / 0.2`) is *stronger* than the unused `shadow-card-hover` token.

### 6.3 Bespoke inline shadows (arbitrary values found in source)

| Value | Where |
|---|---|
| `0 8px 40px rgba(93,142,103,0.13)` | Landing open-letter card — largest, softest paper lift |
| `0 16px 34px rgba(93,142,103,0.12)` | `AboutPage` team professional photo frame |
| `0 14px 28px rgba(93,142,103,0.12)` | Elevated card |
| `0 10px 26px rgba(93,142,103,0.12)` | `SurveyActionCard` logo badge |
| `0 12px 28px rgba(93,142,103,0.18)` | `StoryCard` framer-motion hover shadow |
| `0 12px 48px rgba(0,0,0,0.25)` | Landing game widget **on the solid green band** — neutral shadow is correct here because a green shadow disappears on green |
| `0 10px 24px rgba(0,0,0,0.12)` | `AboutPage` inset "little me" photo |

### 6.4 Tailwind defaults still in use

`shadow-sm` (12 uses — sticky notes, subtle panels, step markers), `shadow-md` (2), `shadow-xl` (1).

**Elevation ladder for a sibling app:**
`shadow-sm` (barely lifted paper) → `shadow-card` (resting card) → `shadow-soft` (button/feature) →
`.card-hover` hover state → bespoke `0 8px 40px` for hero paper.

---

## 7. Background Textures & Paper Effects

### 7.1 `.bg-grid` — notebook grid paper

Defined in `src/index.css`:

```css
.bg-grid {
  background-image:
    linear-gradient(rgba(93, 142, 103, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(93, 142, 103, 0.07) 1px, transparent 1px);
  background-size: 28px 28px;
}
```

Two crossed 1px green lines at 7% alpha on a 28px square grid. Applied by `PageWrapper` to almost
every page (`grid` prop defaults to `true`). Also used as an inset overlay on solid green sections
with `opacity-[0.07]` and on `AboutPage` with `opacity-[0.06]`.

### 7.2 `.bg-lined` — ruled notebook paper

```css
.bg-lined {
  background-image: repeating-linear-gradient(
    transparent,
    transparent 27px,
    rgba(93, 142, 103, 0.1) 27px,
    rgba(93, 142, 103, 0.1) 28px
  );
}
```

Horizontal ruled lines every 28px, 1px thick, 10% alpha. Used on writing surfaces:
the landing hero's open-letter card, `CheckOutPage`'s letter panel, `FeedbackPage`'s form panel.
**Pair it with left padding** (`pl-16`) to leave a margin, plus a peach vertical margin rule and
punched holes to complete the effect — see §13.4.

### 7.3 Tailwind config equivalents

```js
backgroundImage: {
  'grid-paper': `
    linear-gradient(rgba(93,142,103,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(93,142,103,0.07) 1px, transparent 1px)
  `,
},
backgroundSize: { 'grid': '28px 28px' },
```

`bg-grid-paper` is **not used anywhere in source** — the CSS `.bg-grid` utility superseded it.
See [§16](#16-known-quirks-unused-tokens--gotchas) for the `bg-grid` naming collision this creates.

### 7.4 Soft blur blobs

Ambient color washes behind hero content:

```jsx
<div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#9FD89C]/10 blur-3xl pointer-events-none" />
<div className="absolute bottom-0 left-0 w-80 h-60 rounded-full bg-[#FFD1BD]/12 blur-3xl pointer-events-none" />
```

Always `blur-3xl`, always `pointer-events-none`, always 10–12% alpha.

---

## 8. Motion System

Two motion layers coexist: **CSS keyframe animations** (ambient decoration) and **framer-motion**
(interaction + entrance).

### 8.1 CSS keyframes (`tailwind.config.js`)

```js
animation: {
  'float':         'float 6s ease-in-out infinite',
  'float-slow':    'float 9s ease-in-out infinite',
  'float-delayed': 'float 7s ease-in-out 2s infinite',
  'sparkle':       'sparkle 2s ease-in-out infinite',
  'fade-up':       'fadeUp 0.5s ease forwards',
},
keyframes: {
  float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%':      { transform: 'translateY(-12px)' },
  },
  sparkle: {
    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
    '50%':      { opacity: '0.5', transform: 'scale(0.85)' },
  },
  fadeUp: {
    from: { opacity: '0', transform: 'translateY(20px)' },
    to:   { opacity: '1', transform: 'translateY(0)' },
  },
},
```

| Class | Count in source | Applied to |
|---|---|---|
| `animate-float` | 8 | Decorative `Star` icons, `AvatarSlot` when `animated` |
| `animate-float-slow` | 7 | Secondary stars (staggered by duration, not delay) |
| `animate-float-delayed` | 3 | Tertiary stars (2s delay + 7s duration) |
| `animate-sparkle` | 6 | Decorative `Sparkles` icons |
| `animate-fade-up` | **0** | Defined but unused — framer-motion covers entrances instead |

**Star/sparkle decoration recipe** (from `LandingPage`):

```jsx
<Star className="absolute top-6 right-24 text-[#FEE188] animate-float opacity-50 pointer-events-none" size={30} fill="#FEE188" />
<Star className="absolute top-28 left-6 text-[#FEE188] animate-float-slow opacity-35 pointer-events-none" size={18} fill="#FEE188" />
<Star className="absolute bottom-20 right-6 text-[#FEE188] animate-float-delayed opacity-30 pointer-events-none" size={22} fill="#FEE188" />
<Sparkles className="absolute top-12 left-1/3 text-[#9FD89C] animate-sparkle opacity-30 pointer-events-none" size={14} />
<Sparkles className="absolute bottom-32 left-1/4 text-[#FFD1BD] animate-sparkle opacity-35 pointer-events-none" size={12} />
```

Conventions: always `absolute` + `pointer-events-none`; opacity 25–50%; sizes 12–30px; stars are
`#FEE188` with matching `fill`; sparkles cycle through green/peach; mix all three float variants so
they desynchronize.

### 8.2 `prefers-reduced-motion` handling

```css
@media (prefers-reduced-motion: reduce) {
  .animate-float,
  .animate-float-slow,
  .animate-float-delayed,
  .animate-sparkle {
    animation: none !important;
  }
  .card-hover:hover {
    transform: none;
  }
}
```

Ambient float/sparkle stop entirely; the card lift is suppressed (though the box-shadow change
remains).

**framer-motion is gated separately, and it *is* gated.** `src/App.tsx` wraps the whole tree in
`<MotionConfig reducedMotion="user">` (the outermost element, above `AuthProvider` and
`BrowserRouter`), so every `motion.*` component in the app honours the OS setting: transform and
layout animations are dropped, opacity/color animations are kept. Copy both mechanisms into a sibling
app — the CSS block for the keyframe decorations, `MotionConfig` for everything framer-motion drives.

### 8.3 framer-motion patterns

| Pattern | Exact props | Where |
|---|---|---|
| **Button press** | `whileHover={{ scale: 1.02 }}` / `whileTap={{ scale: 0.98 }}` (both `{}` when disabled) | `Button` |
| **Card lift** | `whileHover={{ y: -6, boxShadow: '0 12px 28px rgba(93,142,103,0.18)' }}` | `StoryCard` |
| **Scroll-in section** | `initial={{ opacity: 0, y: 24 }}` `whileInView={{ opacity: 1, y: 0 }}` `viewport={{ once: true }}` `transition={{ duration: 0.5 }}` | Landing sections (×4) |
| **Scroll-in card** | `initial={{ opacity: 0, y: 30 }}` + `transition={{ duration: 0.45, ease: 'easeOut' }}` | Pages (×5 / ×4) |
| **Staggered list** | parent `variants={{ visible: { transition: { staggerChildren: 0.08 } } }}` + `initial="hidden" whileInView="visible" viewport={{ once: true }}`; child `variants={{ hidden: {opacity:0,y:24}, visible:{opacity:1,y:0} }}` | `StoriesPage` → `StoryCard` |
| **Alternating slide-in** | `initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}` → `whileInView={{ opacity: 1, x: 0 }}` | Timeline items |
| **Springy interaction** | `transition={{ type: 'spring', stiffness: 300, damping: 25 }}` (×5) | Interactive widgets |
| **Nav fade-in** | `initial={{ opacity: 0 }}` `animate={{ opacity: 1 }}` `transition={{ duration: 0.3, ease: 'easeOut' }}` | `Navbar` |
| **Nav underline sweep** | parent `whileHover="hov" initial="rest" animate="rest"`; child span `variants={{ rest:{scaleX:0}, hov:{scaleX:1} }}` `style={{ originX: 0 }}` `transition={{ duration:0.2, ease:'easeOut' }}` | `Navbar` desktop links |
| **Accordion** | `initial={{ height: 0, opacity: 0 }}` | Expandable panels |
| **Animated counter** | `useMotionValue(0)` + `useSpring(count, { stiffness: 40, damping: 15 })` + `useTransform(v => Math.round(v).toLocaleString() + suffix)` | `LandingPage` `CountUp` |
| **Delayed stagger (manual)** | `transition={{ duration: 0.45, delay: i * 0.05 }}` | Mapped card lists |

**Duration vocabulary:** `0.2s` (micro/hover), `0.3s` (nav), `0.35–0.45s` (card entrance),
`0.5s` (section entrance). Easing: `easeOut` for entrances, `easeInOut` for reversible transitions.

### 8.4 CSS transition conventions

| Class | Where |
|---|---|
| `transition-all duration-200` | Buttons, chips, nav links |
| `transition-all duration-300` | Game choice buttons, sidebar collapse |
| `transition-colors` | Text-only hover states, footer links |
| `transition-transform` | Arrow nudges |
| `hover:gap-2` on a `gap-1` flex row | Inline "Begin →" links — the arrow slides away from the label on hover. A recurring micro-interaction; see also `group-hover:translate-x-0.5` on the arrow icon. |

### 8.5 Non-animated transform: scattered rotation

Sticky notes and community notes use static CSS rotation for the collage feel:

```jsx
style={{ transform: `rotate(${rotate})` }}   // '-3deg' … '2.5deg'
```

`StoryCard` does the same via framer-motion's `style={{ rotate: parseFloat(rotation) }}`.
Observed values: `-3deg, -2.5deg, -2deg, -1.5deg, -0.5deg, 0.8deg, 1.5deg, 2deg, 2.5deg`.
Keep the magnitude under ~3deg — more reads as broken rather than casual.

---

## 9. Iconography

Three distinct icon layers.

### 9.1 Lucide React — the mapped set (`src/components/ui/IconPlaceholder.tsx`)

`IconPlaceholder` accepts a **string key** and resolves it through this map. This indirection lets
content data (`src/data/index.ts`) reference icons as plain strings.

| Map key | Lucide component |
|---|---|
| `heart` | `Heart` |
| `compass` | `Compass` |
| `star` | `Star` |
| `mail` | `Mail` |
| `award` | `Award` |
| `image` | `Image` |
| `refresh` | `RefreshCw` |
| `feather` | `Feather` |
| `book` | `BookOpen` |
| `pencil` | `Pencil` |
| `leaf` | `Leaf` |
| `sparkles` | `Sparkles` |
| `users` | `Users` |
| `shield` | `Shield` |
| `clock` | `Clock` |
| `play` | `Play` |
| `check` | `Check` |
| `arrow` | `ArrowRight` |
| `gamepad` | `Gamepad2` |

**Fallback:** any unrecognized key resolves to `Sparkles` (`iconMap[icon] ?? Sparkles`) — never
throws, never renders empty.

### 9.2 Lucide icons used directly (outside the map)

Imported straight from `lucide-react` by the file that needs them:

| File | Icons |
|---|---|
| `Navbar` | `Menu`, `X`, `BookOpen`, `LogOut`, `ExternalLink` |
| `Footer` | `Heart` |
| `SurveyActionCard` | `Shield` |
| `LandingPage` | `Star`, `Sparkles`, `ArrowRight`, `ArrowUpRight`, `Pencil`, `Heart`, `BookOpen`, `Gamepad2`, `Users` |
| `CheckInPage` | `Shield`, `Eye`, `Star` |
| `ExplorePage` | `Award`, `ExternalLink`, `Mail`, `ChevronDown`, `ChevronUp` |
| `CheckOutPage` | `Sparkles`, `Check` |
| `StoriesPage` | `Send`, `Shield` |
| `FeedbackPage` | `Send`, `CheckCircle` |
| `SignInPage` | `Eye`, `EyeOff`, `Star` |
| `SignUpPage` | `Eye`, `EyeOff`, `Shield`, `Star`, `Sparkles` |
| `MyNotebookPage` | `Plus`, `Trash2`, `FileText`, `Award`, `ChevronRight`, `LogIn`, `X` |
| `BeforeItBreaksPage` | `Star`, `Sparkles`, `HelpCircle` |

`AboutPage` imports **no** Lucide icons directly — every glyph on it arrives through `IconPlaceholder`
or `DfmIconSlot`.

### 9.3 Icon sizing conventions

| Context | Size |
|---|---|
| Inline with `text-xs` | `size={10}`–`size={13}` |
| Inline with `text-sm` | `size={14}`–`size={16}` |
| Nav / mobile toggle | `size={20}` |
| Step markers in circular badges | `size={20}` (`size={16}` on solid green) |
| `IconPlaceholder` `sm` / `md` / `lg` | `16` / `20` / `26` |
| Decorative floating stars | `size={16}`–`size={30}` |

Icon color is essentially always `text-[#5D8E67]` (or an opacity variant), or `text-[#F9F5ED]` on
green. `Star` is always `text-[#FEE188]` + `fill="#FEE188"`. The footer heart is
`text-[#FFD1BD] fill="#FFD1BD"` at `size={10}`.

### 9.4 The badge treatment

`IconPlaceholder` wraps its icon in a rounded, accent-tinted square badge:

```jsx
<div className={`${wrap} rounded-xl ${accentBg[accent]} flex items-center justify-center flex-shrink-0`}>
  <Icon size={iconSize} className="text-[#5D8E67]" />
</div>
```

| Size | Wrapper | Icon px |
|---|---|---|
| `sm` | `w-9 h-9` (36px) | 16 |
| `md` | `w-12 h-12` (48px) | 20 |
| `lg` | `w-16 h-16` (64px) | 26 |

Accent backgrounds: `yellow` `bg-[#FEE188]/30`, `peach` `bg-[#FFD1BD]/40`,
`softgreen` `bg-[#9FD89C]/30` (default), `softblue` `bg-[#B7E3FF]/40`.

An alternate circular badge treatment appears in the landing journey path — `w-12 h-12 rounded-full`
with a **solid** accent fill, `border-2` in the same accent, and `shadow-sm`.

### 9.5 Custom brand PNG icons

Hand-drawn stationery icons that carry the notebook metaphor. All live in `src/assets/icons/`.

| File | Variant key | Depicts |
|---|---|---|
| `src/assets/icons/dfm_logo_main.png` | `logo` | Sprout emerging from an envelope — the brand mark |
| `src/assets/icons/dfm_pencil_icon.png` | `pencil` | Pencil |
| `src/assets/icons/dfm_notebook_icon.png` | `notebook` | Notebook |
| `src/assets/icons/dfm_scissors_icon.png` | `scissors` | Scissors |
| `src/assets/icons/dfm_glue_icon.png` | `glue` | Glue stick |

Consumed through `DfmIconSlot` (see §11.4). They are used as **decorative section punctuation** —
e.g. a notebook icon beside "A path, not a checklist.", a glue icon beside "You're not the only
one.", scissors beside the "choose what you need" step. They are always `hidden sm:flex` in those
positions so they drop out on mobile.

---

## 10. Imagery & Asset Inventory

```
src/assets/
├── icons/
│   ├── Before_It_Breaks_Logo.png     # Partner game wordmark/logo
│   ├── dfm_glue_icon.png
│   ├── dfm_logo_main.png             # Primary brand mark (sprout + envelope)
│   ├── dfm_notebook_icon.png
│   ├── dfm_pencil_icon.png
│   └── dfm_scissors_icon.png
├── illustrations/                    # EMPTY — reserved; IllustrationSlot renders placeholders
├── partners/
│   └── NHA_logo.png                  # NeuroHealth Alliance
└── team/
    ├── Avantika_Little.jpeg      Avantika_Professional.jpg
    ├── Nikhilesh_Little.jpeg     Nikhilesh_Professional.jpeg
    ├── Sara_Little.jpeg          Sara_Professional.jpeg
    ├── Sophia_Little.jpeg        Sophia_Professional.jpeg
    ├── Suhani_Little.JPG         Suhani_Professional.jpeg
    ├── Tanvi_Little.jpg          Tanvi_Professional.jpeg
    └── Thanh_Little.JPG          Thanh_Professional.JPG
```

### 10.1 Team photo naming convention

**`{FirstName}_{Variant}.{ext}`** where `Variant` ∈ `{Little, Professional}`.

Extensions are inconsistent by design-of-neglect (`.jpg`, `.jpeg`, `.JPG`), so `AboutPage` resolves
them tolerantly:

```ts
const teamImageModules = import.meta.glob(
  '../assets/team/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,avif,AVIF}',
  { eager: true, import: 'default' }
) as Record<string, string>;
```

Matching normalizes both name and variant with `value.toLowerCase().replace(/[^a-z0-9]/g, '')`, so
case and extension never matter. If no file matches, it falls back to a remote placeholder:
`https://placehold.co/600x760/{bg}/355842?text=…` with `bg` = `f6efe0` (professional) or
`d8efe0` (little).

**The "Little Me" photo stack** is a signature `AboutPage` visual: a 4:5 professional portrait in a
`rounded-[2rem]` aged-paper frame, with a square childhood photo tucked into the bottom-right corner
in a `rounded-[1.4rem]` frame with a thick `border-4 border-[#F9F5ED]` (a cream photo-print border)
and a neutral drop shadow — like a snapshot taped onto a portrait.

```jsx
<div className="relative mx-auto mb-6 w-full max-w-[260px]">
  <div className="overflow-hidden rounded-[2rem] border border-[#d4c99a]/60 bg-[#F9F5ED] shadow-[0_16px_34px_rgba(93,142,103,0.12)]">
    <img className="aspect-[4/5] w-full object-cover" … />
  </div>
  <div className="absolute -bottom-4 right-[-8px] w-24 sm:w-28">
    <div className="overflow-hidden rounded-[1.4rem] border-4 border-[#F9F5ED] bg-[#F9F5ED] shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
      <img className="aspect-square w-full object-cover" … />
    </div>
  </div>
</div>
```

### 10.2 Partner logos

- `src/assets/partners/NHA_logo.png` — rendered at `w-24 h-14 object-contain` by `PartnerLogoSlot`
  when `name` matches `'NeuroHealth Alliance'` or `'NeuroHealthAlliance'`.
- Any other partner name falls through to a dashed-border "Logo Slot" placeholder.

### 10.3 Partner game logo

`src/assets/icons/Before_It_Breaks_Logo.png` — imported directly by
`src/pages/BeforeItBreaksPage.tsx` and rendered at `h-16 w-auto object-contain`. Not wrapped in any
slot component.

### 10.4 Placeholder system

Two components exist purely to hold space for art that hasn't been made yet, and both carry TODO
comments in source: `IllustrationSlot` (dashed box, `src/assets/illustrations/` is empty) and
`AvatarSlot` (inline SVG sprout-envelope mascot). Keep this pattern in a sibling app — it makes
missing art visible and obviously intentional rather than broken.

### 10.5 Favicon

`index.html` still points at Vite's default: `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`.
Not branded. A sibling app should replace this.

---

## 11. Component Catalog — `src/components/ui`

All components are named function exports (`export function X`), typed with a local `interface`,
and take an optional `className` string appended last so callers can override.

> **Rendered vs. authored.** Four of the twelve — `ActivityCard`, `FilterChip`, `IllustrationSlot`
> and `StatCard` — are **not imported by any page or layout in the current app**. They are complete,
> on-brand and buildable, but nothing renders them today. They are documented here because they are
> part of the system's vocabulary and are worth carrying into a sibling app; just don't expect to
> find them on a running page. The other eight are live: `AvatarSlot` (BeforeItBreaksPage only),
> `Button`, `DfmIconSlot`, `IconPlaceholder`, `LogoSlot`, `PartnerLogoSlot`, `StoryCard`,
> `SurveyActionCard`.

---

### 11.1 `Button` — `src/components/ui/Button.tsx`

**Props**

| Prop | Type | Default |
|---|---|---|
| `children` | `ReactNode` | — |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'game'` | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `onClick` | `() => void` | — |
| `className` | `string` | `''` |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` |
| `disabled` | `boolean` | `false` |
| `fullWidth` | `boolean` | `false` |

**Variants**

```
primary   bg-[#5D8E67] text-[#F9F5ED] hover:bg-[#4a7254] shadow-soft border-2 border-[#5D8E67]
secondary bg-transparent text-[#5D8E67] border-2 border-[#5D8E67] hover:bg-[#5D8E67]/8
ghost     bg-[#9FD89C]/25 text-[#5D8E67] border-2 border-[#9FD89C] hover:bg-[#9FD89C]/40
game      bg-[#F9F5ED] text-[#5D8E67] border-2 border-[#5D8E67] hover:bg-[#9FD89C]/20 w-full
```

**Sizes**

```
sm  px-4 py-2 text-sm  rounded-xl
md  px-6 py-3 text-base rounded-2xl
lg  px-8 py-4 text-lg  rounded-2xl
```

**Always-on classes**

```
font-comfortaa font-semibold transition-all duration-200
focus:outline-none focus:ring-2 focus:ring-[#5D8E67] focus:ring-offset-2
disabled:opacity-50 disabled:cursor-not-allowed
```

**Motion:** `motion.button` with `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}`,
both replaced with `{}` when `disabled`.

> **Visual description.** A pill-ish, chunky button with a consistent **2px border on every
> variant** — even the solid primary, which borders itself in its own fill color so that all four
> variants have identical geometry and never shift layout when swapped. Primary is a solid deep-green
> lozenge with cream type and a soft green glow beneath it. Secondary is the same shape rendered as a
> green outline on the page's cream, filling with an 8% green wash on hover. Ghost is the softest
> option — a pale mint fill inside a soft-green outline, used for in-card actions where a solid
> button would be too loud. Game is a cream-filled, deep-green-outlined full-width button intended
> for stacked answer choices. The whole thing scales up 2% on hover and dips 2% on press, which reads
> as "gentle press" rather than "click".

**Override note:** because `className` is concatenated last, callers override variant colors
directly — e.g. the landing page's yellow CTA is
`<Button variant="primary" className="bg-[#FEE188] border-[#FEE188] text-[#5D8E67] hover:bg-[#fad96a] hover:border-[#fad96a]">`.

---

### 11.2 `ActivityCard` — `src/components/ui/ActivityCard.tsx`

**Props:** `id: string`, `title: string`, `prompt: string`, `button: string`, `icon: string`
(IconPlaceholder map key), `accent: 'yellow'|'peach'|'softgreen'|'softblue'`, `highlighted?: boolean`.

**Container**

```
relative rounded-2xl border-2 p-6 bg-[#F9F5ED] card-hover cursor-pointer
{accentBorder[accent]}
{highlighted && `${accentBg[accent]} ring-2 ring-offset-1 ring-[#5D8E67]/30`}
flex flex-col gap-4
```

**Internals**

- `highlighted` badge: `absolute -top-2.5 left-4 bg-[#5D8E67] text-[#F9F5ED] text-[10px]
  font-comfortaa font-bold px-3 py-0.5 rounded-full` reading **"Recommended for you"**.
- `<IconPlaceholder icon={icon} accent={accent} size="lg" />`
- `<h3 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-1">`
- `<p className="font-handwriting text-[#5D8E67]/75 text-base leading-snug">`
- `<Button variant="ghost" size="sm" className="mt-auto self-start">`

**Behavior:** when `id === 'before-it-breaks'`, the button opens `BEFORE_IT_BREAKS_URL`
(`https://before-it-breaks.vercel.app/`) in a new tab via
`window.open(url, '_blank', 'noopener,noreferrer')`. For every other `id` the click handler is a
literal no-op — the component exposes no `onClick` prop, so a parent has no way to hook navigation in.
Since nothing renders `ActivityCard` today this is untested; a sibling app should add an `onAction`
callback rather than special-casing an id.

> **Visual description.** A cream card outlined in a solid 2px pastel that names its category, with
> a large tinted icon badge at the top, a bold green title, and a handwritten prompt beneath it in
> Caveat — so the card literally reads as "a printed label with a note scribbled under it". A ghost
> button is pinned to the bottom-left with `mt-auto self-start`, so cards of different text lengths
> in the same grid row keep their buttons aligned to the card bottom while staying left-aligned
> rather than stretched. When `highlighted`, the card gains a matching pastel wash, a soft green
> focus-like ring, and a small deep-green "Recommended for you" tab that overhangs the top edge like
> a filing-cabinet tab. Hovering lifts it 4px on the shared `.card-hover` transition.

---

### 11.3 `AvatarSlot` — `src/components/ui/AvatarSlot.tsx`

**Props:** `size?: 'sm'|'md'|'lg'|'xl'` (default `'md'`), `className?`, `animated?: boolean`
(default `false`).

**Sizes:** `sm w-12 h-12` (48) · `md w-20 h-20` (80) · `lg w-32 h-32` (128) · `xl w-48 h-48` (192).

**Container:** `w-full h-full rounded-2xl border-2 border-[#5D8E67] bg-[#F9F5ED] flex flex-col
items-center justify-center gap-1`. When `animated`, the outer wrapper gets `animate-float`.

**Used by:** `BeforeItBreaksPage` only, as `<AvatarSlot size="md" animated />` inside the game-preview
card. `lg` and `xl` are defined but never used.

**Inline SVG mascot** (`viewBox="0 0 48 48"`, `w-3/5 h-3/5`, `stroke="#5D8E67" strokeWidth="2"`,
round caps/joins):

```jsx
<rect x="6" y="16" width="36" height="26" rx="4" fill="#9FD89C" fillOpacity="0.3" />
<polyline points="6,16 24,30 42,16" />          {/* envelope flap */}
<line x1="24" y1="16" x2="24" y2="8" />          {/* stem */}
<path d="M19 8 Q24 2 29 8" />                    {/* leaf */}
<circle cx="24" cy="8" r="1.5" fill="#5D8E67" /> {/* seed */}
```

> **Visual description.** A rounded-square cream tile with a 2px deep-green outline containing a
> line-drawn envelope, mint-washed inside, with a small stem and leaf sprouting from its top edge —
> the sprout-envelope mascot in placeholder form. It floats gently when `animated`. The file carries
> a `// TODO: Replace with sprout-envelope mascot or team photo PNG when assets are ready` comment;
> `src/assets/illustrations/` is reserved for the real artwork.

---

### 11.4 `DfmIconSlot` — `src/components/ui/DfmIconSlot.tsx`

**Props**

| Prop | Type | Default |
|---|---|---|
| `variant` | `DfmIconVariant = 'logo' \| 'pencil' \| 'notebook' \| 'scissors' \| 'glue'` | required |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` |
| `className` | `string` | `''` |

**Sizes:** `xs w-7 h-7` (28) · `sm w-10 h-10` (40) · `md w-14 h-14` (56) · `lg w-20 h-20` (80).

**Rendered output:** a single `<img>` with `object-contain flex-shrink-0` plus the size classes.
No wrapper, no badge, no background.

**Alt text map:** `logo → "Dear Future Me"`, `pencil → "Pencil"`, `notebook → "Notebook"`,
`scissors → "Scissors"`, `glue → "Glue"`.

> **Visual description.** A thin, dependency-free image wrapper that renders one of five hand-drawn
> brand PNGs at a fixed square footprint. Because it applies no background or padding, it drops into
> flex rows as a decorative "sticker" — a notebook next to a section title, scissors floating beside
> a step card, the logo mark next to the wordmark in the navbar. `flex-shrink-0` guards against it
> collapsing inside tight flex containers. `size="lg"` (80px) is used inside `SurveyActionCard`'s
> 112px badge; `size="sm"` (40px) is the navbar logo.

---

### 11.5 `FilterChip` — `src/components/ui/FilterChip.tsx`

**Props:** `label: string`, `active?: boolean`, `onClick?: () => void`.

```
px-4 py-2 rounded-full text-sm font-comfortaa font-semibold border-2 transition-all duration-200
focus:outline-none focus:ring-2 focus:ring-[#5D8E67] focus:ring-offset-1

active   → bg-[#5D8E67] text-[#F9F5ED] border-[#5D8E67]
inactive → bg-[#F9F5ED] text-[#5D8E67] border-[#9FD89C] hover:bg-[#9FD89C]/25
```

> **Visual description.** A small semibold pill used for tag filtering on the stories page.
> Inactive it's a cream pill inside a soft-green outline that fills with a 25% mint wash on hover;
> active it inverts into a solid deep-green pill with cream text. The 2px border is present in both
> states so the chip never changes size when toggled. Focus ring offset is `1` here (tighter than
> `Button`'s `2`) because chips sit close together in a wrapped row.

---

### 11.6 `IconPlaceholder` — `src/components/ui/IconPlaceholder.tsx`

**Props:** `icon: string` (map key, see §9.1), `size?: 'sm'|'md'|'lg'` (default `'md'`),
`accent?: 'yellow'|'peach'|'softgreen'|'softblue'` (default `'softgreen'`), `className?`.

Full implementation and sizing table in [§9.4](#94-the-badge-treatment).

> **Visual description.** A soft rounded-square tint chip with a deep-green Lucide glyph centered in
> it — the app's universal "category marker". Because it resolves icons by string key with a
> `Sparkles` fallback, page content can be authored as plain data in `src/data/index.ts` without
> importing components. `flex-shrink-0` keeps it circular-square inside flex rows. The 12%-to-40%
> accent washes are deliberately weaker than the corresponding card borders so the glyph stays the
> most legible thing in the badge.

---

### 11.7 `IllustrationSlot` — `src/components/ui/IllustrationSlot.tsx`

**Props:** `label?: string` (default `'Illustration'`), `className?`,
`aspectRatio?: string` (default `'aspect-video'`).

```
{aspectRatio} rounded-2xl border-2 border-dashed border-[#9FD89C] bg-[#F9F5ED]
flex items-center justify-center
  └── <span className="text-xs font-comfortaa text-[#5D8E67] opacity-50">{label}</span>
```

> **Visual description.** A dashed soft-green rectangle on cream with a faint centered caption —
> the visual equivalent of a pencilled "art goes here" box in a layout comp. The dashed border and
> 50% opacity label make it obviously deliberate rather than broken. The `aspectRatio` prop takes a
> raw Tailwind aspect class, so callers can pass `aspect-square`, `aspect-[4/5]`, etc.

---

### 11.8 `LogoSlot` — `src/components/ui/LogoSlot.tsx`

**Props:** `size?: 'sm'|'md'|'lg'` (default `'md'`), `className?`, `showText?: boolean`
(default `true`).

**Sizes:** `sm w-8 h-8` (32) · `md w-10 h-10` (40) · `lg w-14 h-14` (56).

```jsx
<div className="flex items-center gap-2.5">
  <img src={dfmLogo} alt="Dear Future Me" className={`${sizes[size]} object-contain flex-shrink-0`} />
  {showText && (
    <span className="font-comfortaa font-bold text-[#5D8E67] leading-none text-sm whitespace-nowrap">
      Dear Future Me
    </span>
  )}
</div>
```

> **Visual description.** The lockup: the sprout-envelope mark with the wordmark "Dear Future Me" to
> its right in bold Comfortaa at a fixed `text-sm`, separated by a 10px gap. Notably the wordmark
> does **not** scale with the `size` prop — only the mark grows — so the lockup reads consistently
> whether it's a 32px navbar mark or a 56px footer mark. `leading-none` + `whitespace-nowrap` keep
> the wordmark on one line and vertically centered against the mark.

**Used by:** `Footer`, `SignInPage` and `SignUpPage` — all three at `size="lg"`, and `lg` is the only
size actually used in the app. The `Navbar` does *not* use `LogoSlot` — it hand-rolls the same
lockup with `DfmIconSlot variant="logo" size="sm"` plus an identically-styled span.

---

### 11.9 `PartnerLogoSlot` — `src/components/ui/PartnerLogoSlot.tsx`

**Props:** `name: string`, `className?`.

Recognized names: `['NeuroHealth Alliance', 'NeuroHealthAlliance']`.

**Known partner branch**

```
flex flex-col items-center gap-2 text-center
  ├── <img src={NHA_logo} alt="NeuroHealth Alliance" className="w-24 h-14 object-contain mx-auto" />
  └── <span className="text-xs font-comfortaa text-[#5D8E67] opacity-70 leading-tight">NeuroHealth Alliance</span>
```

**Fallback branch** (carries a `// TODO: Add logo assets for additional partners` comment)

```
flex flex-col items-center gap-1.5
  ├── w-20 h-12 rounded-xl border-2 border-dashed border-[#9FD89C] bg-[#F9F5ED]
  │     └── "Logo Slot" — text-[10px] font-comfortaa text-[#5D8E67] opacity-60 text-center px-1 leading-tight
  └── <span className="text-xs font-comfortaa text-[#5D8E67] opacity-70 text-center max-w-[80px] leading-tight">{name}</span>
```

> **Visual description.** A centered, captioned logo tile. For NeuroHealth Alliance it shows the real
> PNG in a 96×56 contain box with the partner name in small muted green beneath. For anyone else it
> degrades to a smaller 80×48 dashed placeholder tile labeled "Logo Slot", still captioned with the
> passed name and clamped to `max-w-[80px]` so long partner names wrap into a tidy column. The
> component is a name-keyed registry — adding a partner means adding an image import and extending
> the match.

---

### 11.10 `StatCard` — `src/components/ui/StatCard.tsx`

**Props:** `value: string`, `label: string`, `accent?: 'yellow'|'peach'|'softgreen'|'softblue'`
(default `'softgreen'`).

```
rounded-2xl border-2 {accentMap[accent]} p-5 text-center card-hover
  ├── <div className="text-3xl font-comfortaa font-bold text-[#5D8E67] mb-1">{value}</div>
  └── <div className="text-sm font-comfortaa text-[#5D8E67]/80 leading-snug">{label}</div>
```

`accentMap`: `yellow bg-[#FEE188]/50 border-[#FEE188]` · `peach bg-[#FFD1BD]/50 border-[#FFD1BD]` ·
`softgreen bg-[#9FD89C]/30 border-[#9FD89C]` · `softblue bg-[#B7E3FF]/40 border-[#B7E3FF]`.

> **Visual description.** A compact, centered pastel tile: a big bold deep-green number over a
> short muted label. Unlike `ActivityCard`, the fill is present by default (30–50% accent wash), so a
> row of `StatCard`s reads as a bright, cheerful band of color. `value` is a `string`, not a number,
> which is what lets the app render things like `↓ 3.95→3.32` alongside plain counts. Hovering lifts
> it via `.card-hover`.

---

### 11.11 `StoryCard` — `src/components/ui/StoryCard.tsx`

**Props:** `text: string`, `tags: string[]`, `color?: 'yellow'|'peach'|'softgreen'|'softblue'`
(default `'yellow'`), `rotation?: string` (default `'0deg'`).

```jsx
<motion.div
  className={`${colorBg[color]} rounded-xl p-5 shadow-card border border-white/60`}
  style={{ rotate: parseFloat(rotation) }}
  variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
  transition={{ duration: 0.45 }}
  whileHover={{ y: -6, boxShadow: '0 12px 28px rgba(93,142,103,0.18)' }}
>
  <div className="flex justify-end mb-3">
    <div className="w-3 h-3 rounded-full bg-[#5D8E67]/30" />   {/* the "pin" */}
  </div>
  <p className="font-handwriting text-[#3a5c42] text-lg leading-relaxed mb-4">"{text}"</p>
  <div className="flex flex-wrap gap-1.5">
    {tags.map(tag => (
      <span className={`text-xs font-comfortaa font-semibold px-2.5 py-0.5 rounded-full ${tagBg[color]}`}>{tag}</span>
    ))}
  </div>
</motion.div>
```

`colorBg`: yellow `/60` · peach `/60` · softgreen `/40` · softblue `/50`.
`tagBg`: solid accent for yellow/peach/softblue; `#9FD89C/60` for softgreen. All tag text `#5D8E67`.

> **Visual description.** A pastel sticky note. The `border border-white/60` is the key trick — a
> 1px semi-transparent white edge that reads as the lit top edge of a real paper square against the
> cream page. A small translucent green dot sits in the top-right as a pushpin. The quote itself is
> Caveat at `text-lg` in the deep body green with explicit surrounding quote marks, and category
> pills sit along the bottom in the same hue at full strength. `rotation` is passed as a string like
> `'1.5deg'` and parsed to a number for framer-motion; a grid of these with varied rotations produces
> the "wall of pinned notes" effect. Hovering floats it 6px with a deepened green shadow.

**Stagger contract:** `StoryCard` declares `variants` but no `initial`/`animate` — it expects a
framer-motion parent driving `initial="hidden" whileInView="visible"` with
`variants={{ visible: { transition: { staggerChildren: 0.08 } } }}`. See `StoriesPage`:

```jsx
<motion.div
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
  variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
  initial="hidden" whileInView="visible" viewport={{ once: true }}
>
```

---

### 11.12 `SurveyActionCard` — `src/components/ui/SurveyActionCard.tsx`

**Props:** `title?`, `description?`, `primaryLabel: string`, `secondaryLabel?`,
`onPrimary?`, `onSecondary?`.

```
bg-[#F9F5ED] border-2 border-[#9FD89C] rounded-3xl p-8 shadow-soft
flex flex-col items-center gap-6 text-center max-w-lg mx-auto

├── Logo badge: w-28 h-28 rounded-[2rem] border-2 border-[#9FD89C]/60 bg-[#FFFDF8]
│     shadow-[0_10px_26px_rgba(93,142,103,0.12)] flex items-center justify-center
│     └── <DfmIconSlot variant="logo" size="lg" className="w-20 h-20" />
├── {title}       → h2.font-comfortaa.font-bold.text-[#5D8E67].text-2xl
├── {description} → p.font-handwriting.text-[#5D8E67]/80.text-lg.leading-relaxed
├── CTA row: flex flex-col sm:flex-row gap-3 w-full justify-center
│     ├── <Button variant="primary" size="lg">{primaryLabel}</Button>
│     └── <Button variant="secondary" size="lg">{secondaryLabel}</Button>   (conditional)
└── Trust note: flex items-center gap-2 text-xs font-comfortaa text-[#5D8E67]/60
      └── <Shield size={12} /> "Anonymous & judgment-free"
```

> **Visual description.** The system's largest, most ceremonial card — a wide, very round
> (`rounded-3xl`) cream panel with a soft-green 2px outline and a diffuse green glow. At the top, the
> sprout-envelope logo sits inside a 112px squircle badge on a brighter off-white, with its own
> shadow, so the mark appears to float above the card. Below: a bold 24px title, a handwritten
> description in Caveat, then large primary and secondary buttons that stack vertically on mobile and
> sit side by side from `sm` up. A tiny shield glyph and the words "Anonymous & judgment-free" close
> the card in 12px muted green — the reassurance line that precedes every survey handoff.

---

## 12. Layout Catalog — `src/components/layout`

### 12.1 `AppShell` — `src/components/layout/AppShell.tsx`

```jsx
<div className="flex flex-col min-h-screen bg-[#F9F5ED]">
  <Navbar />
  <div className="flex-1">{children}</div>
  <Footer />
</div>
```

A sticky-footer column: full viewport height minimum, content region flexes to fill, footer pinned
to the bottom on short pages. The cream background is set here as well as on `body` and
`PageWrapper` — triple-redundant, but it guarantees no white flash at any nesting level.

---

### 12.2 `Navbar` — `src/components/layout/Navbar.tsx`

**Root:** `motion.nav` with `className="sticky top-0 z-50"` and a fade-in
(`initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3, ease:'easeOut'}}`).

**Bar:** `bg-[#F9F5ED]/80 backdrop-blur-sm border-b border-[#9FD89C]/25` — a translucent frosted
cream strip. Inner container: `max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-14`
(**56px tall**, deliberately compact).

**Left — brand.** A `<button>` (navigates to `/`) containing
`<DfmIconSlot variant="logo" size="sm" />` (40px) plus a span styled exactly like `LogoSlot`'s
wordmark: `font-comfortaa font-bold text-[#5D8E67] leading-none text-sm whitespace-nowrap`.
Focus: `focus-visible:ring-2 focus-visible:ring-[#5D8E67] rounded-lg`.

**Center — desktop nav (`hidden lg:flex items-center gap-0.5`).**
Links come from `navLinks` in `src/data/index.ts`:

| Label | Path |
|---|---|
| Home | `/` |
| Check In | `/check-in` |
| Explore | `/explore` |
| Check Out | `/check-out` |
| Stories | `/stories` |
| About | `/about` |

Each is a `NavLink` styled
`block px-3 py-1.5 rounded-full text-[13px] font-comfortaa font-medium transition-all duration-200`:

- active → `bg-[#9FD89C]/45 text-[#5D8E67]`
- inactive → `text-[#5D8E67]/65 hover:text-[#5D8E67] hover:bg-[#9FD89C]/15`

Each link is wrapped in a `motion.div` (`whileHover="hov" initial="rest" animate="rest"`) containing
an absolutely positioned underline that sweeps in from the left:

```jsx
<motion.span
  className="absolute bottom-1 left-3 right-3 h-[1.5px] bg-[#5D8E67]/50 rounded-full pointer-events-none"
  variants={{ rest: { scaleX: 0 }, hov: { scaleX: 1 } }}
  style={{ originX: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
/>
```

Then an **external** link to `BEFORE_IT_BREAKS_URL` with the same styling plus
`<ExternalLink size={12} />` inside an `inline-flex items-center gap-1`, and its own underline sweep.

**Divider:** `<div className="w-px h-4 bg-[#9FD89C]/40 mx-2" />`

**Right — auth region.**

*Signed out:*
- `Sign In` `NavLink` → `/sign-in`, same pill styling as nav links.
- `Sign Up` `<button>` → `/sign-up`:
  `ml-1 px-4 py-1.5 rounded-full text-[13px] font-comfortaa font-semibold bg-[#5D8E67] text-[#F9F5ED] hover:bg-[#4a7254] transition-all`

*Signed in:*
- Display name span: `font-comfortaa text-[12px] text-[#5D8E67]/50 px-2`.
  Resolution order: `user.user_metadata.name ?? user.email.split('@')[0] ?? 'You'`.
- `My Notebook` `NavLink` → `/notebook` with **yellow** active styling (the only yellow nav state):
  active `bg-[#FEE188]/50 text-[#5D8E67]`, inactive `hover:bg-[#FEE188]/25`. Icon `<BookOpen size={13} />`.
- `Log out` button: `text-[#5D8E67]/60 hover:bg-[#9FD89C]/15`, icon `<LogOut size={13} />`.
  Calls `signOut()` then `navigate('/')`.

**Mobile hamburger (`lg:hidden`).**
`p-2 rounded-xl text-[#5D8E67]/70 hover:bg-[#9FD89C]/20 focus-visible:ring-2 focus-visible:ring-[#5D8E67]`,
`aria-label="Toggle menu"`, swapping `<Menu size={20} />` ↔ `<X size={20} />`.

**Mobile panel** (conditional render, no exit animation):

```
lg:hidden bg-[#F9F5ED]/95 backdrop-blur-sm border-b border-[#9FD89C]/30 px-5 py-3 flex flex-col gap-0.5
```

Each item: `px-4 py-2.5 rounded-xl text-sm font-comfortaa font-medium`
(active `bg-[#9FD89C]/40`, inactive `text-[#5D8E67]/70 hover:bg-[#9FD89C]/15`). Every item closes the
menu via `onClick={() => setOpen(false)}`. Auth controls sit in a two-up row at the bottom:
`flex gap-2 mt-2 pt-2 border-t border-[#9FD89C]/25` with `flex-1 text-center px-4 py-2 rounded-xl`
buttons.

> **Visual description.** A slim 56px frosted cream bar that stays pinned at the top. Left is the
> sprout-envelope mark and wordmark; center-right is a tight row of small rounded-full text pills
> where the active page is filled with a 45% mint wash and hovering any link draws a hairline green
> underline that wipes in from the left. A thin vertical rule separates navigation from account
> controls, which end in a solid green Sign Up pill or, once signed in, a first name, a
> yellow-accented "My Notebook" pill, and a quiet Log out. Below `lg`, everything collapses to a
> hamburger that drops a nearly opaque cream panel of the same pills stacked vertically with the auth
> buttons split 50/50 at the bottom.

---

### 12.3 `Footer` — `src/components/layout/Footer.tsx`

**Root:** `bg-[#F9F5ED] border-t border-[#9FD89C]/40 mt-auto`.
**Container:** `max-w-7xl mx-auto px-4 sm:px-6 py-12`.
**Grid:** `grid grid-cols-1 md:grid-cols-3 gap-8 mb-8`.

**Column 1 — brand.** `<LogoSlot size="lg" />` (56px mark) plus a Caveat tagline
`font-handwriting text-[#5D8E67]/75 text-base leading-relaxed max-w-xs`:
*"A space for students to pause, reflect, and remember they are more than what they achieve."*

**Column 2 — Pages.** Heading `font-comfortaa font-bold text-[#5D8E67] mb-3 text-sm uppercase
tracking-wide` reading "Pages". Links come from `footerLinks` = `[...navLinks, { label: 'Feedback',
path: '/feedback' }]` — i.e. the six nav routes **plus** `/feedback`. Each is
`text-sm font-comfortaa text-[#5D8E67]/70 hover:text-[#5D8E67] transition-colors`, stacked
`flex flex-col gap-2`.

**Column 3 — "In Collaboration With".** Same uppercase heading style with `mb-4`, then
`<PartnerLogoSlot name="NeuroHealth Alliance" className="sm:items-start" />` in a
`flex items-center gap-4 flex-wrap` row.

**Bottom bar.** `border-t border-[#9FD89C]/30 pt-6 flex flex-col sm:flex-row items-center
justify-between gap-3`, both lines `text-xs font-comfortaa text-[#5D8E67]/60`:

- Left: "In collaboration with NeuroHealth Alliance"
- Right: `© 2026 Dear Future Me - made with <Heart size={10} className="text-[#FFD1BD]" fill="#FFD1BD" /> for students`

> **Visual description.** A quiet three-column band separated from the page by a soft mint hairline.
> The left column leads with the largest instance of the logo lockup and a handwritten mission line;
> the middle is a plain stacked link list under a small uppercase, letter-spaced heading; the right
> credits the partner with their logo. A second hairline separates a small centered/split bottom row
> carrying the collaboration credit and the copyright, the latter punctuated by a tiny peach filled
> heart. Everything is at 60–75% green opacity — the footer is deliberately the lowest-contrast
> region of the page.

---

### 12.4 `PageWrapper` — `src/components/layout/PageWrapper.tsx`

```jsx
<main className={`min-h-screen ${grid ? 'bg-grid' : ''} bg-[#F9F5ED] ${className}`}>
  {children}
</main>
```

**Props:** `children`, `className?` (default `''`), `grid?: boolean` (**default `true`**).

> **Visual description.** The semantic `<main>` for every page. It guarantees a full-viewport cream
> canvas and, by default, lays the 28px notebook grid over it — so unless a page opts out with
> `grid={false}`, the whole app is drawn on graph paper. `className` is appended last, so pages can
> add their own padding or override the background.

---

## 13. Recurring Page-Level Patterns

These aren't extracted components, but they repeat enough to be part of the system.

### 13.1 `HandwrittenLabel` (LandingPage-local)

```jsx
<span className="font-handwriting text-[#5D8E67]/55 text-3xl flex items-center gap-1 select-none">
  {children}
</span>
```

Lowercase margin annotations placed near, but not inside, the thing they describe — often
absolutely positioned above a card (`absolute -top-10 left-8`) or above a section heading with
`mb-2`. Frequently paired with a tiny Lucide glyph (`<Pencil size={11} />`) or a trailing `→`.
On green backgrounds the color becomes `text-[#9FD89C]/70`.

### 13.2 Sticky note

```jsx
<div
  className="bg-[#FEE188]/70 rounded-lg px-4 py-3 shadow-sm border border-white/50 card-hover cursor-default max-w-[220px]"
  style={{ transform: 'rotate(-2deg)' }}
>
  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#5D8E67]/30 flex-shrink-0" />
  <p className="font-handwriting text-[#3a5c42] text-lg leading-snug mt-1.5">{text}</p>
</div>
```

Key ingredients: accent fill at 50–70%, `border border-white/50` (the paper edge highlight),
`rounded-lg` (tighter than cards), `shadow-sm`, a small translucent pin dot, Caveat body,
`max-w-[220px]`, and a small static rotation.

### 13.3 Hand-drawn annotation arrow

```jsx
<svg width="36" height="44" viewBox="0 0 36 44" className="text-[#5D8E67]/30">
  <path d="M2 4 Q10 4 18 36" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  <path d="M15 38 L18 36 L20 39" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
</svg>
```

A quadratic-curve shaft plus a two-segment arrowhead, `strokeWidth="1.5"`, round caps,
`currentColor` at `text-[#5D8E67]/30`. Used to connect a handwritten label to the element it points
at. Also appears mirrored (`d="M42 4 Q20 8 6 28"`).

### 13.4 Notebook page / open letter

The most elaborate composite in the app (`LandingPage` hero):

```jsx
<div className="relative bg-[#FDFAF3] border border-[#d4c99a]/60 rounded-2xl shadow-[0_8px_40px_rgba(93,142,103,0.13)] overflow-hidden">
  {/* margin rule */}
  <div className="absolute left-14 top-0 bottom-0 w-px bg-[#FFD1BD]/60 pointer-events-none" />
  {/* three punched holes */}
  <div className="absolute left-5 top-8  w-3 h-3 rounded-full border-2 border-[#d4c99a]/50 bg-[#F9F5ED]" />
  <div className="absolute left-5 top-20 w-3 h-3 rounded-full border-2 border-[#d4c99a]/50 bg-[#F9F5ED]" />
  <div className="absolute left-5 top-32 w-3 h-3 rounded-full border-2 border-[#d4c99a]/50 bg-[#F9F5ED]" />
  {/* ruled writing area, indented past the margin */}
  <div className="bg-lined pl-16 pr-6 pt-8 pb-8"> … </div>
</div>
```

Opens with a Caveat salutation: `font-handwriting text-[#5D8E67]/60 text-4xl mb-5 tracking-wide` →
*"Dear Future Me,"*.

A **spiral-binding** variant appears in `MyNotebookPage`/`ExplorePage`: a row of
`w-3 h-3 rounded-full border-[1.5px] border-[#9b8c72]/45 bg-[#e4ddd0]` holes along a
`border-b border-[#c8b89a]/30` toolbar on a `#f5f1e8` chrome strip.

### 13.5 Highlighter underline on a heading word

```jsx
<span className="relative inline-block">
  more than
  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 120 8" preserveAspectRatio="none">
    <path d="M2 4 Q80 3 118 8" stroke="#FEE188" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
</span>
```

A slightly wobbly yellow stroke under a single emphasized word — hand-underlined, not a rule.

### 13.6 Journey step row

```jsx
<div className="flex items-start gap-6 ml-4">          {/* alternating: ml-4 / ml-10 sm:ml-24 */}
  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#FFD1BD] border-2 border-[#FFD1BD]/80 flex items-center justify-center shadow-sm">
    <Heart size={20} className="text-[#5D8E67]" />
  </div>
  <div className="bg-[#FFD1BD]/25 border border-[#FFD1BD]/60 rounded-2xl p-5 max-w-sm card-hover">
    <h3 className="font-comfortaa font-bold text-[#5D8E67] text-lg mb-1">…</h3>
    <p className="font-comfortaa text-[#5D8E67]/65 text-sm leading-relaxed">…</p>
    <button className="mt-3 font-comfortaa text-xs text-[#5D8E67] flex items-center gap-1 hover:gap-2 transition-all">
      Begin <ArrowRight size={12} />
    </button>
  </div>
  <StickyNote … className="hidden md:block self-center" />
</div>
```

Steps are separated by `gap-16`, connected by a `<line>` SVG at `x=16` in a 32px-wide left gutter
(`stroke="#9FD89C" strokeWidth="2" strokeOpacity="0.5"`), and alternate their left margin so the
column zig-zags. Each step cycles a different accent (peach → yellow → soft-green → soft-blue →
deep green at `/8` fill with `/20` border).

### 13.7 Receipt / field-notes panel

`bg-[#F9F5ED] border border-[#d4c99a]/60 rounded-xl shadow-card overflow-hidden w-56` with a solid
green header bar (`bg-[#5D8E67] px-4 py-2`, uppercase `tracking-wider` cream label plus a Caveat
date range in `#9FD89C`), separated by `border-t border-dashed border-[#d4c99a]/50 mx-3` dashed
rules, and a highlighted final row on `bg-[#9FD89C]/20`. Numbers use `tabular-nums` and the
`CountUp` spring counter.

### 13.8 Mini meter (progress bar)

```jsx
<div className="flex flex-col gap-1">
  <div className="flex justify-between">
    <span className="text-[10px] font-comfortaa font-semibold text-[#5D8E67]/70">{label}</span>
    <span className="text-[10px] font-comfortaa text-[#5D8E67]/50">{value}%</span>
  </div>
  <div className="w-full h-1.5 rounded-full bg-[#9FD89C]/20">
    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%`, transition: 'width 0.6s ease' }} />
  </div>
</div>
```

Track `bg-[#9FD89C]/20`, height `h-1.5` (6px), both track and fill `rounded-full`, 0.6s width
transition. Semantic bar colors: Social `#FFD1BD`, Mental `#FEE188`, Physical `#B7E3FF`.

A segmented variant exists for step/duration indicators: five `h-1.5 flex-1 rounded-full` bars where
filled = `bg-[#5D8E67]/30` and empty = `bg-[#5D8E67]/10`.

### 13.9 Section header (asymmetric)

Headers are **left-aligned, not centered**, and often bottom-aligned against a decorative icon:

```jsx
<div className="mb-14 flex items-end gap-4">
  <div>
    <HandwrittenLabel className="mb-2">how it works</HandwrittenLabel>
    <h2 className="font-comfortaa font-bold text-[#5D8E67] text-3xl sm:text-4xl">A path, not a checklist.</h2>
  </div>
  <DfmIconSlot variant="notebook" size="md" className="mb-1 hidden sm:flex" />
</div>
```

### 13.10 Inline "text link with arrow"

```jsx
<button className="font-comfortaa text-sm text-[#5D8E67]/70 hover:text-[#5D8E67] flex items-center gap-1 transition-colors">
  Explore activities <ArrowRight size={14} />
</button>
```

The system's tertiary action — used beside a primary `Button` rather than a third button. Variants
add `hover:gap-2` (label/arrow separate) or `group-hover:translate-x-0.5` on the icon.

### 13.11 Inverted feature band

A full-bleed `bg-[#5D8E67]` section with `bg-grid opacity-[0.07]` inset overlay, floating yellow
stars at 25–35% opacity, cream headings at `text-4xl sm:text-5xl`, `#9FD89C`-tinted handwritten
quotes, a yellow-overridden primary button, and a cream card floating on top with a **neutral**
`0 12px 48px rgba(0,0,0,0.25)` shadow. Used once (landing "Before It Breaks") as the page's single
high-contrast moment.

---

## 14. Accessibility & Focus

| Concern | Convention |
|---|---|
| Focus rings — buttons | `focus:outline-none focus:ring-2 focus:ring-[#5D8E67] focus:ring-offset-2` |
| Focus rings — chips | same, with `focus:ring-offset-1` |
| Focus rings — nav/icon buttons | `focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D8E67]` (keyboard-only) |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed`; framer-motion hover/tap disabled too |
| Div-as-button | `role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && …}` (landing portal cards) |
| Icon-only controls | `aria-label` (e.g. `aria-label="Toggle menu"`) |
| Decorative elements | `pointer-events-none` on every floating star, blob, connector SVG, and margin rule |
| Alt text | Every asset-bearing component supplies meaningful alt (`DfmIconSlot`, `LogoSlot`, `PartnerLogoSlot`, team photos: `` `${name} professional portrait` `` / `` `${name} childhood portrait` ``) |
| Reduced motion | Two layers, both present: the CSS `@media (prefers-reduced-motion: reduce)` block in `index.css` for keyframe decorations, and `<MotionConfig reducedMotion="user">` in `App.tsx` for framer-motion — see [§8.2](#82-prefers-reduced-motion-handling). |
| Semantics | `PageWrapper` renders `<main>`; `Footer` renders `<footer>`; `Navbar` renders `<nav>` (via `motion.nav`) |
| External links | `target="_blank"` + `rel="noreferrer"` (anchors) / `'noopener,noreferrer'` (window.open), always with a visible `<ExternalLink />` glyph |

**Contrast caution.** Deep green `#5D8E67` on cream `#F9F5ED` is roughly 3.3:1 — it passes WCAG AA
for large text but **not** for small body text, and the pervasive `/55`–`/70` opacity conventions
push it lower still. If the sibling app has accessibility requirements, plan to darken the body
text toward `#3a5c42` (already the `body` default) or `#2d4a35` for small copy.

---

## 15. Scrollbar

Webkit-only, defined at the bottom of `src/index.css` outside any `@layer`:

```css
::-webkit-scrollbar        { width: 6px; }
::-webkit-scrollbar-track  { background: #F9F5ED; }
::-webkit-scrollbar-thumb  { background: #9FD89C; border-radius: 8px; }
```

A 6px mint thumb with an 8px radius on a cream track — no hover state, no `::-webkit-scrollbar-thumb:hover`,
and no Firefox `scrollbar-color` fallback.

---

## 16. Known Quirks, Unused Tokens & Gotchas

Read this section before porting the config verbatim.

1. **`bg-grid` is doubly defined.** `tailwind.config.js` declares `backgroundSize: { 'grid': '28px 28px' }`,
   which generates a `bg-grid` utility meaning *background-size*. `src/index.css` separately defines a
   `.bg-grid` utility meaning *background-image + background-size*. Both land in the utilities layer, so
   the effective result depends on emission order. The CSS one is what the app relies on. **Recommendation
   for a sibling app:** rename one of them (e.g. `backgroundSize: { 'grid-28': '28px 28px' }`).

2. **`bg-grid-paper` is dead.** The `backgroundImage.grid-paper` token is never referenced in source;
   `.bg-grid` in CSS replaced it. Keep one, drop the other.

3. **`shadow-card-hover` is dead.** Defined in config, used nowhere. `.card-hover:hover` uses a
   *different, stronger* inline value (`0 12px 36px / 0.2` vs the token's `0 8px 32px / 0.18`).

4. **`animate-fade-up` / `fadeUp` keyframe is dead.** framer-motion `initial`/`whileInView` covers
   all entrance animation.

5. **`font-caveat` and `font-serif` tokens are dead.** Code uses the CSS utilities `.font-handwriting`
   and `.font-italic-serif` instead. And `.font-italic-serif` itself is currently **unused** — Playfair
   Display is loaded on every page but never rendered. Removing it from the Google Fonts URL would be a
   free performance win in a sibling app.

6. **Tailwind's `green` scale is destructively overridden.** `colors.green = { deep, soft }` replaces
   Tailwind's default `green-50…green-950`. `green-500` etc. do not exist. Same for `yellow` (only
   `yellow-soft`) and `blue` (only `blue-soft`). If a sibling app needs default palettes, nest under a
   distinct key (e.g. `brand.green.deep`) instead.

7. **Two near-identical primary-hover greens.** `#4a7254` (Button, Navbar) vs `#4a7255`
   (MyNotebookPage, ExplorePage). Almost certainly a typo. Standardize on one.

8. **Tokens vs arbitrary values.** The palette is fully tokenized but essentially never used as tokens;
   every component hardcodes hex in `bg-[#…]` form. This works but defeats the purpose of the config.
   Decide up front which convention the sibling app uses.

9. **`ActivityCard` has `cursor-pointer` on the whole card but only the inner `Button` is clickable**
   (and only for the `before-it-breaks` id). The card body is not an interactive element.

10. **`Navbar` duplicates `LogoSlot`'s markup** rather than using the component — the wordmark span is
    copy-pasted. If you change the lockup, change it in two places.

11. **`StoryCard` cannot animate standalone.** It declares `variants` but no `initial`/`animate`, so it
    only appears if a framer-motion parent drives the `hidden`/`visible` states. Rendering it outside
    such a parent leaves it in its default (visible) state — fine, but the entrance is lost.

12. **The mobile menu has no exit animation** — it's a plain conditional render, so it disappears
    instantly. There is no `AnimatePresence` anywhere in the layout.

13. **`line-clamp-2/3` are hand-rolled** in `src/index.css`. Tailwind 3.3+ ships `line-clamp` natively;
    the custom versions omit `-webkit-` prefixed `display` fallbacks that the plugin includes.

14. **`src/assets/illustrations/` is empty**; `IllustrationSlot` and `AvatarSlot` both carry TODOs.

15. **Favicon is still `/vite.svg`.**

16. **Reduced motion needs both halves.** The `index.css` media query only covers the CSS keyframe
    decorations; framer-motion is handled separately by `<MotionConfig reducedMotion="user">` in
    `App.tsx`. Port one without the other and half the motion stops respecting the OS setting.

17. **Four catalog components are unrendered.** `ActivityCard`, `FilterChip`, `IllustrationSlot` and
    `StatCard` are imported by nothing. `ActivityCard` was written to render one entry of
    `src/data/index.ts`'s `activities` array, which is itself unused — `ExplorePage` hand-codes its
    three activities instead. Nothing is broken; they are just dormant. Decide deliberately whether a
    sibling app wants them.

18. **`Button`'s `game` variant is dead.** The `'game'` value is in the prop union and has styles
    (`bg-[#F9F5ED] … w-full`), but no call site passes it; the landing/BeforeItBreaks choice buttons are
    hand-rolled `<button>`s instead.

---

## 17. Quick-Start Checklist for a Sibling App

**Copy verbatim:**

- [ ] `tailwind.config.js` — colors, fontFamily, animation, keyframes, boxShadow
      (apply fixes from §16.1, §16.2, §16.3, §16.6)
- [ ] `src/index.css` in full — base layer, utilities, reduced-motion block, scrollbar
- [ ] The Google Fonts `<link>` from `index.html` (drop `Playfair+Display` if unused)
- [ ] `src/components/ui/Button.tsx`, `FilterChip.tsx`, `IconPlaceholder.tsx`,
      `IllustrationSlot.tsx`, `StatCard.tsx`, `StoryCard.tsx`, `SurveyActionCard.tsx` — all
      brand-generic
- [ ] `src/components/layout/AppShell.tsx`, `PageWrapper.tsx` — no brand coupling
- [ ] The `<MotionConfig reducedMotion="user">` wrapper from `App.tsx` — the framer-motion half of
      reduced-motion support (§8.2)

**Rebrand (app-specific content, same structure):**

- [ ] `LogoSlot.tsx` / `DfmIconSlot.tsx` — swap the PNG set, keep the size maps and `object-contain flex-shrink-0`
- [ ] `Navbar.tsx` — swap `navLinks`, keep the pill + underline-sweep + `lg` breakpoint pattern
- [ ] `Footer.tsx` — swap tagline, links, partner; keep the 3-column + bottom-bar structure
- [ ] `PartnerLogoSlot.tsx` — extend the name registry
- [ ] `AvatarSlot.tsx` — replace the inline SVG mascot
- [ ] `ActivityCard.tsx` — remove the hardcoded `before-it-breaks` special case

**Non-negotiables to preserve the family resemblance:**

1. Cream `#F9F5ED` everywhere — never white.
2. All text is green-tinted `#5D8E67` / `#3a5c42`, never gray or black.
3. All shadows are `rgba(93,142,103, …)`, never neutral — except on green backgrounds.
4. Two fonts working in tension: structured Comfortaa + handwritten Caveat. Never one alone.
5. `rounded-2xl` cards, `rounded-full` pills. Nothing square.
6. 2px borders on interactive elements; 1px on dividers and paper edges.
7. Pastel accents live at low opacity — the four-accent system (`yellow | peach | softgreen | softblue`)
   is applied by prop, not chosen ad hoc.
8. Text opacity carries hierarchy (`/80` → `/70` → `/55` → `/30`), not different colors.
9. Notebook texture (`.bg-grid`) is on by default; `.bg-lined` marks any surface you write on.
10. Motion is slow and small: 4–6px lifts, 1.02 scales, 6–9s ambient floats.
11. Asymmetry is intentional — offset margins, left-aligned headers, small rotations, margin annotations.
