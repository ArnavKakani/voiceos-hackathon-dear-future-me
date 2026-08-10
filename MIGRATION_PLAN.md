# Dear Future Me — Migration Plan

> Source of truth for wiring the new UI into the existing Supabase backend.
> Written 2026-05-12. Based on AUDIT.md (old codebase) + full read of both `src/` trees.
> **Do not write code until this document is reviewed and approved.**

---

## Section 1 — New UI Feature Inventory

### Routes

| Route | Page Component | Auth Required |
|---|---|---|
| `/` | `LandingPage` | No |
| `/check-in` | `CheckInPage` | No |
| `/explore` | `ExplorePage` | No (optional auth for saving) |
| `/check-out` | `CheckOutPage` | No |
| `/stories` | `StoriesPage` | No |
| `/about` | `AboutPage` | No |
| `/feedback` | `FeedbackPage` | No |
| `/sign-in` | `SignInPage` | No |
| `/sign-up` | `SignUpPage` | No |
| `/notebook` | `MyNotebookPage` | **Yes** (inline gate) |
| `/before-it-breaks` | `BeforeItBreaksPage` | No |

Note: `/before-it-breaks` is referenced throughout the landing page and `BeforeItBreaksPage` exists but is not registered in `App.tsx`. That route must be added.

---

### Pages

#### `LandingPage` (`/`)

**Data displayed:**
- Impact receipt (hardcoded): 1,109 pre-survey responses, 989 post-reflections, 720 workshop attendees, 26 schools, anxiety drop 3.95 → 3.32
- 6 community stories pulled from `data/index.ts` (static, not from DB)
- Mini game widget (Before It Breaks preview): 3 choices from `data/gameChoices`
- Journey path: 5 steps (static copy)
- Community notes wall: same 6 static stories in sticky-note layout

**Forms:** None

**Interactions:**
- Navigate to `/check-in`, `/explore`, `/before-it-breaks`, `/stories`, `/check-out`, `/sign-up`
- Interactive AP load picker (3 buttons) → updates Social/Mental/Physical meters live (local state only, no DB)
- "Read all stories" link

---

#### `CheckInPage` (`/check-in`)

**Data displayed:**
- Static privacy features list (4 bullet points)
- Step indicator: "step 1 of your journey"

**Forms:**
- No input fields. Two actions: open external survey (currently `alert()` stub) and continue.

**Interactions:**
- "Open Check-In Survey" → `alert()` placeholder (needs real survey URL)
- "I Finished, Continue" → navigate to `/explore`
- "Skip for now" → navigate to `/explore`

---

#### `ExplorePage` (`/explore`)

Three accordion sections. All saves are currently local state only.

**Non-Resume Accomplishments section:**
- Data displayed: Static description
- Form: Textarea (8 rows) → "Save" button → shows saved text in read view with "Edit" link
- Interactions: Write, save to local state, edit. No Supabase, no auth check.

**Vision Board section:**
- Data displayed: Google Slides vs. Canva step-by-step instructions (toggled). Live Padlet iframe embed (`padlet.com/embed/az8l0z5n3ovuib6a`).
- Form: Toggle between Slides/Canva option
- Interactions: Tab toggle, open Padlet in new tab, iframe interaction

**Letter to Future Self section:**
- Data displayed: Community count badge "650 letters saved" (hardcoded `COMMUNITY_COUNT = 650`)
- Form: Title input + body textarea (14 rows) + char counter. "Save letter" button.
- State: `saved` flag shows read view; "View all my letters" link → `/notebook`
- Interactions: Write letter, save to local state, navigate to `/notebook`. No Supabase call.

**Note:** `data/index.ts` defines 6 activities (non-resume, vision-board, letter, before-it-breaks, gratitude, reset) and 6 mood filters, but ExplorePage only renders 3 hardcoded activities. Mood-based filtering and the Gratitude Note / Reset Card activities are defined in data but **not yet implemented** in the page.

---

#### `CheckOutPage` (`/check-out`)

**Data displayed:**
- Anxiety stat: 3.95 → 3.32 (hardcoded)
- Completion confirmation card

**Forms:**
- "Open Post-Reflection Survey" → `alert()` stub (needs real URL)
- "Finish Journey" → sets `completed = true`
- Optional textarea: "One thing I want to remember is…" — no submit, no Supabase
- "Save & Finish" button → sets `completed = true` with reflection text preserved in local state

**Interactions:**
- Post-completion: show confirmation, display saved reflection text, navigate to `/` or `/stories`

---

#### `StoriesPage` (`/stories`)

**Data displayed:**
- Story grid: 6 hardcoded stories from `data/index.ts` → rendered as `StoryCard` components (text, tags, color, rotation)
- Submission card below the grid

**Forms:**
- Textarea for anonymous story submission
- "Share Anonymously" button → sets `submitted = true` (local state only, no Supabase)

**Interactions:**
- Read stories, submit story (currently no-op beyond UI state)

---

#### `AboutPage` (`/about`)

**Data displayed:** Fully static.
- Founders quote block (3 co-founders: Nikhilesh, Tanvi, Suhani)
- Anxiety drop stat block (3.95 → 3.32)
- Team bios: 3 co-founders + 2 team members + 1 placeholder slot
- 4 key stats, 4 beliefs, 5 platform features
- 6-item timeline from `data/timelineItems`
- Partners section: NeuroHealthAlliance (logo slot placeholder)
- Photo slots: all placeholder circles labeled "Add Photo Here"

**Forms:** None
**Interactions:** None (purely informational)

---

#### `FeedbackPage` (`/feedback`)

**Data displayed:** 5 feedback categories with color-coded borders.

**Categories:**
| id | Label |
|---|---|
| `liked` | Something I liked |
| `confused` | Something that confused me |
| `wish` | Something I wish existed |
| `story` | A story I want to share |
| `bug` | Bug or technical issue |

**Forms:**
- Category pill selector (5 options)
- Textarea with category-specific placeholder
- "Send Feedback" submit button → sets `submitted = true` (local state only, no Supabase)

**Interactions:** Switch categories (clears textarea), submit → confirmation screen, "Submit Another" resets

---

#### `SignInPage` (`/sign-in`)

**Data displayed:** Logo slot placeholder, welcome copy

**Forms:**
- Email field
- Password field with show/hide toggle
- "Forgot password?" button (no-op)
- Submit: `onSubmit` → `navigate('/explore')` (stub — not calling any auth)
- "Continue as Guest" → `navigate('/explore')`
- Link to `/sign-up`

**Interactions:** Show/hide password, navigate on submit

---

#### `SignUpPage` (`/sign-up`)

**Data displayed:** Logo slot placeholder, privacy note

**Forms:**
- Name/nickname field
- Email field
- Password field with show/hide toggle
- Submit: `onSubmit` → `navigate('/explore')` (stub)
- "Continue as Guest" → `navigate('/explore')`
- Link to `/sign-in`

**Interactions:** Show/hide password, navigate on submit

---

#### `MyNotebookPage` (`/notebook`)

**Data displayed (when logged in):**
- Sidebar: file tree grouped by type (Letters, Accomplishments, Notes) with entry titles
- Entry count in sidebar header
- Editor: selected entry in notebook-paper UI with title, body, type badge, date, day-of-week row

**Data source:** Currently all in-memory `useState`. Seed entries are 3 hardcoded `SEED` objects:
- `seed-1`: letter — "When things feel too heavy" (May 8, 2026)
- `seed-2`: accomplishment — "I actually asked for help" (Apr 22, 2026)
- `seed-3`: note — "Things that actually helped" (Apr 15, 2026)

**Forms:**
- New entry: type selector (letter/note/accomplishment) + "New entry" button
- Editor: title input (mono font), body textarea (handwriting font) — saves on `onBlur`
- Delete: trash icon → confirmation overlay → delete

**Interactions:**
- Create entry (inserts at top of list, selects it)
- Click sidebar entry to switch active editor
- Edit title/body — autosave on blur
- Delete entry with confirm overlay
- Toggle sidebar open/closed
- Auth gate: if `user === null` → shows login prompt card; "Log in to continue" calls `login()` (stub)

**Entry types:**
| type | Label | Color |
|---|---|---|
| `letter` | Letter | Yellow |
| `note` | Note | Soft green |
| `accomplishment` | Accomplishment / "win" | Peach |

---

#### `BeforeItBreaksPage` (`/before-it-breaks`)

**Data displayed:**
- Game widget: health meters (Social/Mental/Physical) that update based on AP load choice
- 3 game choices from `data/gameChoices`: "6 AP Classes", "3 AP Classes", "No AP Classes"
- Avatar slot placeholder (animated)
- 3 feature cards (static copy)
- "How the Game Works" toggleable info block

**Forms:** None (game is single-question widget, not a real multi-step game)

**Interactions:**
- Select AP load → meters update live (local state)
- "Enter the Semester" → `alert('Full game coming soon!')`
- "How the Game Works" → toggles info block
- Bottom CTA: "Enter the Semester" → same alert stub

---

### New UI Components

#### Layout
- `AppShell` — outer shell (Navbar + Footer wrapper)
- `Navbar` — sticky nav; shows "My Notebook" + "Log out" when `user` is non-null, "Sign In" + "Log In" when null; "Log In" calls stub `login()`
- `Footer` — static (not read)
- `PageWrapper` — per-page width/padding wrapper

#### UI Primitives
- `Button` — variants: `primary`, `secondary`, `ghost`; supports `size`, `fullWidth`, `disabled`, `type`
- `StatCard` — impact stat display card
- `StoryCard` — community story with text, tags array, color variant, rotation
- `SurveyActionCard` — two-action card: primary (open survey) + secondary (continue)
- `ActivityCard` — activity display (used in data, not yet in ExplorePage)
- `FilterChip` — mood filter button (in data but not yet wired in ExplorePage)
- `AvatarSlot` — avatar placeholder (used in BeforeItBreaksPage, animated prop)
- `DfmIconSlot` — icon illustration slots (variants: logo, notebook, pencil, scissors, glue)
- `LogoSlot` — text logo placeholder
- `PartnerLogoSlot` — partner logo placeholder
- `IllustrationSlot` — illustration placeholder
- `IconPlaceholder` — generic icon with accent color

---

## Section 2 — Gap Analysis

### Features in the new UI that the old UI did not have

| Feature | Where | Notes |
|---|---|---|
| `BeforeItBreaksPage` | `/before-it-breaks` | Fully new. Interactive semester simulator with health meters. Currently only a widget demo — full game is marked "coming soon". |
| Dedicated SignIn / SignUp pages | `/sign-in`, `/sign-up` | Old used `AuthModal` overlaid on any page. New has full-page auth flows. |
| `MyNotebookPage` unified sidebar-editor | `/notebook` | Combines letters + notes + accomplishments into one editor with a file-tree sidebar. Replaces `/dashboard` + `/journal` as the main post-login destination. |
| Stories community wall | `/stories` | Replaces both `Testimonials` and `AccomplishmentFeed`. Anonymous, tag-filtered, moderation-gated (`is_approved` flow). Submission form is inline, not a separate route. |
| Mood-based activity filtering | `data/index.ts` | Six mood filters (overwhelmed, behind, burned-out, hopeful, unsure, comparing) mapped to activities. `FilterChip` component exists. **Not yet wired in ExplorePage** — only 3 of 6 activities render. |
| Gratitude Note activity | `data/index.ts` | Defined with prompt "Name one small thing that kept you going." Not yet implemented in ExplorePage accordion. |
| Reset Card activity | `data/index.ts` | Defined as "60-second pause." Not yet implemented in ExplorePage accordion. |
| Journey path visualization | `LandingPage` | 5-step visual path with SVG line, icons, and inline sticky notes. |
| Impact receipt widget | `LandingPage` | Receipt-style card showing 1,109 / 989 / 720 / 26 stats. Currently hardcoded. |
| Community notes wall | `LandingPage` | Masonry-style sticky notes from stories data. |
| Before It Breaks featured section | `LandingPage` | Full dark-green section with interactive AP-picker widget. |
| Notebook-style paper UI aesthetic | Throughout | Spiral rings, grid paper, handwriting font (Caveat), lined paper background — applied to all writing activities. |
| `/before-it-breaks` route missing from App.tsx | — | `BeforeItBreaksPage` file exists and is linked from LandingPage/ExplorePage/data but is not registered in the router. Needs to be added. |

---

### Features in the old UI missing or changed in the new UI

| Feature | Old Route | Status in New UI |
|---|---|---|
| Profile page | `/profile` | **Missing entirely.** No profile management, no name/email/phone editing, no notification toggle, no weekly reminder opt-in. Must be added. |
| Admin page | `/admin` | Missing. Acceptable for Phase 4 — can remain in old codebase or be rebuilt separately. |
| Surveys page | `/surveys` | Replaced by `CheckInPage` + `CheckOutPage`, which is a better UX. No action needed. |
| Thanksgiving / gratitude page | `/thanksgiving` | Missing. Old had community gratitude feed against `thanksgiving_gratitude` table. New has a "Gratitude Note" activity in data but not implemented. Could be revived as the Gratitude activity or retired. |
| Mental health resources (Exit page) | `/thank-you` | Missing. Old had Dublin, CA area resource listings. New `CheckOutPage` shows only the anxiety stat + navigation. Consider adding a resources section to CheckOutPage. |
| `AuthModal` | Component | Replaced by dedicated pages. Good — no action needed. |
| `ProtectedRoute` component | Component | Replaced by inline `if (!user)` gate in `MyNotebookPage`. For future protected pages (Profile), the same pattern applies. |
| `ThemeContext` | Context | Removed. New UI uses Tailwind directly. Good — no action needed. |
| `AccomplishmentFeed` (public community feed) | `/explore/accomplishments` | Concept changed: accomplishments in new UI are **private** (saved to user's notebook, not shared publicly). Community sharing is now through `StoriesPage` only. The public `accomplishments` table is no longer surfaced in the new UI. |
| `letter_counts` tracking | `letter_counts` table | Old tracked copy-count. New shows hardcoded 650. Needs live count wired from new `notebook_entries` table. |
| Community stats on landing (live) | `Welcome.tsx` | Old had hardcoded "250+ Letters, 1,500+ Members, 650+ Stories." New also hardcodes the impact receipt. Both are static — Phase 4 should decide whether to wire these. |
| Google OAuth sign-in | `AuthModal` | Not yet present in new SignInPage / SignUpPage. The new auth pages only have email+password form. Must add Google OAuth button when wiring auth. |

---

## Section 3 — Supabase Changes Required

### 3.1 New Table: `notebook_entries`

This is the core new table. The new `MyNotebookPage` needs a unified store for letters, notes, and accomplishments. The old `journals` table is not suitable as-is: it uses `journal_id` as PK (not `id`), has no `type` column, and treats letters as a separate table. Creating `notebook_entries` is cleaner.

```sql
-- Migration: create notebook_entries
CREATE TABLE public.notebook_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('letter', 'note', 'accomplishment')),
  title       text,
  body        text        NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.notebook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notebook entries"
  ON public.notebook_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notebook entries"
  ON public.notebook_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notebook entries"
  ON public.notebook_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notebook entries"
  ON public.notebook_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at on every edit
CREATE OR REPLACE FUNCTION set_notebook_entry_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER notebook_entries_updated_at
  BEFORE UPDATE ON public.notebook_entries
  FOR EACH ROW EXECUTE FUNCTION set_notebook_entry_updated_at();
```

**No data migration from old tables is needed for launch.** Old `journals` and `letters` rows belong to the old flow. New users start fresh in `notebook_entries`. If backward compatibility is desired later, a one-time migration can copy old `journals` rows (type='note') and `letters` rows (type='letter') into `notebook_entries`.

---

### 3.2 New Table: `stories`

The old `testimonials` table has a different column shape (uses `testimonial_content`, `author_name`, `is_approved`) and the new StoriesPage is fully anonymous with tag arrays. Retrofit would be confusing; create `stories`.

```sql
-- Migration: create stories
CREATE TABLE public.stories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  content     text        NOT NULL,
  tags        text[]      DEFAULT '{}',
  is_approved boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved stories"
  ON public.stories FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "Anyone can submit a story"
  ON public.stories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Reuse existing profanity check trigger
CREATE TRIGGER check_profanity_stories
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION check_profanity();
```

**Seed the 6 stories from `data/index.ts` as approved rows:**

```sql
INSERT INTO public.stories (content, tags, is_approved) VALUES
  (
    'I thought everyone else had it figured out. They didn''t. None of us do, and somehow that made me feel less alone.',
    ARRAY['Comparison', 'Hope'],
    true
  ),
  (
    'My small win was sleeping before midnight for once. It felt rebellious and also like the most caring thing I''d done for myself in months.',
    ARRAY['Small wins', 'Burnout'],
    true
  ),
  (
    'I''m trying to stop treating rest like a reward I have to earn. Rest is not a trophy. It''s just something I need.',
    ARRAY['Burnout', 'Academic pressure'],
    true
  ),
  (
    'I want future me to know I was trying. Even when it didn''t look like it from the outside.',
    ARRAY['Hope', 'Academic pressure'],
    true
  ),
  (
    'My parents want me to be a doctor. I want to make music. I haven''t told them yet, but I told this page.',
    ARRAY['Family pressure', 'College anxiety'],
    true
  ),
  (
    'I got rejected from my top school and somehow it was... kind of okay? I thought it would break me. It didn''t.',
    ARRAY['College anxiety', 'Hope'],
    true
  );
```

---

### 3.3 New RPC: `count_community_letters`

`ExplorePage > LetterSection` shows a "650 letters saved by our community" badge. This must come from a live count of `notebook_entries WHERE type = 'letter'`. Because RLS restricts SELECT to each user's own rows, a `SECURITY DEFINER` function is needed to aggregate across all users.

```sql
CREATE OR REPLACE FUNCTION public.count_community_letters()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.notebook_entries WHERE type = 'letter';
$$;
```

Call from the frontend with:
```ts
const { data } = await supabase.rpc('count_community_letters');
```

---

### 3.4 Supabase Client — add to new codebase

The new UI has no `supabase/client.ts`. The old one at `src/supabase/client.ts` must be copied into the new project and the env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` added to `.env.local`.

```ts
// src/supabase/client.ts  (copy from old codebase)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```

---

### 3.5 `feedback` Table — no schema change, new category values only

The existing `feedback` table (columns: `feedback_id`, `submitted_at`, `feedback_content`, `category`, `email`) works for the new FeedbackPage. No constraint enforces the `category` value, so no migration is needed. Just document the new category strings:

| New value | Maps from old |
|---|---|
| `liked` | (new) |
| `confused` | (new) |
| `wish` | maps to old `suggestion` |
| `story` | (new) |
| `bug` | same as old `bug` |

The new FeedbackPage does not collect an email address. If email collection is still needed, add an optional email field to FeedbackPage when wiring.

---

### 3.6 `profiles` Table — no schema change needed

The existing `profiles` table (id, name, email, phone, notifications_enabled, created_at, updated_at) and its `on_auth_user_created` trigger are compatible with the new auth flow. When wiring `AuthContext.signUp`, pass `options.data.name` exactly as the old code did and the trigger will auto-populate the profile row.

A **Profile page** must be added to the new UI (see Gap Analysis). When built, it should read/write `profiles` using the same Supabase calls as the old `Profile.tsx`.

---

### 3.7 Summary of Database Changes

| Change | Type | Urgency |
|---|---|---|
| Create `notebook_entries` table | New table | **Required before wiring MyNotebookPage** |
| Create `stories` table | New table | **Required before wiring StoriesPage** |
| Seed 6 stories as approved rows | Data seed | Required for StoriesPage to show content |
| Add `count_community_letters` RPC | New function | Required for live letter count badge |
| Copy `supabase/client.ts` to new project | New file | Required before any Supabase wiring |
| `feedback` — no migration, new categories documented | Documentation | Informational |
| `profiles` — no change | — | None |
| `journals`, `letters`, `accomplishments`, `thanksgiving_gratitude` | Existing | Leave as-is; old flow still works |
| Add `@supabase/supabase-js` to new project's `package.json` | Dependency | Required before any Supabase wiring |

---

## Section 4 — Wiring Checklist

Wire in this order. Each item depends on the ones above it.

---

### 1. Install Supabase and copy client
- Add `@supabase/supabase-js` to `package.json`
- Create `src/supabase/client.ts` (see 3.4 above)
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`

**No component changes yet — just scaffolding.**

---

### 2. `src/context/AuthContext.tsx`
**Currently:** Stub — `login()` sets `{ name: 'Student', initials: 'S' }`; `logout()` sets null. `user` is a local `{ name, initials }` object.

**Needs:**
- Replace with real Supabase auth (copy and adapt old `AuthContext.tsx`)
- Expose: `user` (Supabase User | null), `session`, `loading`, `signUp(email, password, name)`, `signIn(email, password)`, `signInWithGoogle()`, `signOut()`
- Listen to `supabase.auth.onAuthStateChange` for session persistence
- Remove the stub `login` / `logout` methods (or keep `login` as an alias for `signIn` redirect if needed by `MyNotebookPage`)

**Files affected:** `src/context/AuthContext.tsx`

---

### 3. `src/pages/SignInPage.tsx`
**Currently:** `onSubmit` navigates to `/explore` without calling any auth.

**Needs:**
- Call `AuthContext.signIn(email, password)` on submit
- Show error message on failure
- On success: navigate to `/notebook`
- Add Google OAuth button calling `AuthContext.signInWithGoogle()`
- Wire "Forgot password?" to `supabase.auth.resetPasswordForEmail(email)`

**Tables/auth touched:** `supabase.auth.signInWithPassword`, `supabase.auth.signInWithOAuth`

---

### 4. `src/pages/SignUpPage.tsx`
**Currently:** `onSubmit` navigates to `/explore` without calling any auth.

**Needs:**
- Call `AuthContext.signUp(email, password, name)` on submit
- Show error message on failure
- On success: navigate to `/notebook` (profile row auto-created by DB trigger)
- Add Google OAuth button

**Tables/auth touched:** `supabase.auth.signUp`, `profiles` (auto via trigger)

---

### 5. `src/components/layout/Navbar.tsx`
**Currently:** Calls stub `login()` and `logout()`. Hardcodes user display as 'Student'.

**Needs:**
- Replace stub `login` call (on "Log In" button) with `navigate('/sign-in')`
- Replace stub `logout` call with `AuthContext.signOut()`
- Show real user name from `user.user_metadata?.name` or `user.email`
- Add loading state (while `loading === true`, show neither auth state)

**No Supabase direct calls — reads only from AuthContext.**

---

### 6. `src/pages/MyNotebookPage.tsx`
**Currently:** `useState(SEED)` with 3 hardcoded entries. Auth gate calls stub `login()`.

**Needs:**
- On mount (when `user` is non-null): `SELECT * FROM notebook_entries WHERE user_id = auth.uid() ORDER BY created_at DESC`
- `createEntry(type)`: `INSERT INTO notebook_entries (user_id, type, title, body)`
- `updateEntry(entry)` on blur: `UPDATE notebook_entries SET title=..., body=..., updated_at=now() WHERE id=...`
- `deleteEntry()`: `DELETE FROM notebook_entries WHERE id=...`
- Auth gate: replace `login()` stub with `navigate('/sign-in')`
- Add loading spinner while initial fetch is in progress
- Add empty state when `notebook_entries` returns 0 rows (remove SEED fallback)
- Show `user.user_metadata?.name` instead of hardcoded "Student" in sidebar user tag

**Tables:** `notebook_entries` (SELECT, INSERT, UPDATE, DELETE)

---

### 7. `src/pages/ExplorePage.tsx` — `LetterSection`
**Currently:** "Save letter" sets local state only. Community count is hardcoded 650.

**Needs:**
- On mount: call `count_community_letters()` RPC → set community count state
- "Save letter" button:
  - If user is logged in: `INSERT INTO notebook_entries (user_id, type='letter', title, body)`; on success show "View in My Notebook" link
  - If guest: save to local state as before (no upsert without auth)
- After save, show navigate link to `/notebook`

**Tables/RPC:** `notebook_entries` (INSERT), `count_community_letters` RPC

---

### 8. `src/pages/ExplorePage.tsx` — `NonResumeSection`
**Currently:** "Save" sets local state only.

**Needs:**
- "Save" button:
  - If user is logged in: `INSERT INTO notebook_entries (user_id, type='accomplishment', title=null, body=text)`
  - If guest: keep local-state-only behavior (acceptable for anonymous use)

**Tables:** `notebook_entries` (INSERT)

---

### 9. `src/pages/StoriesPage.tsx`
**Currently:** Shows 6 static stories from `data/index.ts`. Submit sets local state only.

**Needs:**
- On mount: `SELECT id, content, tags FROM stories WHERE is_approved = true ORDER BY created_at DESC`
- Replace static `stories` import with live DB data
- "Share Anonymously" submit:
  - `INSERT INTO stories (content)` — tags can be empty array by default; moderation sets `is_approved`
  - Show confirmation state on success (existing UI is ready)
- Add loading state for initial story fetch

**Tables:** `stories` (SELECT approved rows, INSERT new submission)

---

### 10. `src/pages/FeedbackPage.tsx`
**Currently:** "Send Feedback" sets `submitted = true` locally. No Supabase.

**Needs:**
- "Send Feedback" button: `INSERT INTO feedback (feedback_content=text, category=activeCategory)`
- No email collected in current UI — omit `email` field or add optional email input
- Show confirmation on success; show error on failure

**Tables:** `feedback` (INSERT)

---

### 11. `src/pages/LandingPage.tsx` — Community notes wall
**Currently:** Uses 6 hardcoded stories from `data/index.ts` for both the sticky note wall and the card previews.

**Needs:**
- On mount: `SELECT content, tags FROM stories WHERE is_approved = true ORDER BY created_at DESC LIMIT 6`
- Replace static `stories.slice(...)` references with live DB rows
- Keep rotation/color as display logic (assign deterministically by index)

**Tables:** `stories` (SELECT approved rows)

---

### 12. `src/pages/LandingPage.tsx` — Impact receipt stats
**Currently:** All 5 stats are hardcoded strings.

**Decision required:** These stats (1,109 surveys, 989 reflections, etc.) come from research data, not live DB aggregates. **Recommend keeping hardcoded** and updating manually as milestones are reached. Only wire if you want live counts — in which case it requires new aggregate tables or functions. Do not block other wiring on this.

---

### 13. `src/pages/CheckInPage.tsx` and `src/pages/CheckOutPage.tsx` — Survey URLs
**Currently:** Both survey buttons call `alert()`.

**Needs:**
- Replace `alert(...)` with `window.open(SURVEY_URL, '_blank')` where `SURVEY_URL` is the real QuestionPro (or replacement platform) URL
- These are the same URLs used by the old `Survey.tsx` pre/post flows — retrieve from the old codebase or from the platform dashboard

**No Supabase changes needed.**

---

### 14. `src/pages/CheckOutPage.tsx` — Optional reflection save
**Currently:** Reflection textarea saves to local state only; shown in completion screen.

**Needs (optional, not blocking):**
- If user is logged in: on "Save & Finish", `INSERT INTO notebook_entries (user_id, type='note', title='Reflection', body=reflection)`
- If guest: keep local-state-only behavior

**Tables:** `notebook_entries` (INSERT, conditional on auth)

---

### 15. Add missing `/before-it-breaks` route to `src/App.tsx`
**Currently:** `BeforeItBreaksPage` exists at `src/pages/BeforeItBreaksPage.tsx` and is linked from LandingPage, but the route is not registered in `App.tsx`.

**Needs:**
```tsx
import { BeforeItBreaksPage } from './pages/BeforeItBreaksPage';
// inside <Routes>:
<Route path="/before-it-breaks" element={<BeforeItBreaksPage />} />
```

**No Supabase changes.**

---

### 16. Add Profile page (new, not in new UI)
**Currently:** No Profile page in new UI. Old `Profile.tsx` has name, email, phone, notifications toggle, weekly reminder info, account statistics.

**Needs:**
- Create `src/pages/ProfilePage.tsx` in new UI style (notebook aesthetic, Comfortaa font)
- Wire to existing `profiles` table: SELECT on mount, UPSERT on save
- Add `/profile` route to `App.tsx`
- Add "Profile" link to Navbar for authenticated users (after "My Notebook")

**Tables:** `profiles` (SELECT, UPSERT)

---

### Wiring Order Summary

| # | Component / File | Supabase / Auth dependency |
|---|---|---|
| 1 | Install deps + `supabase/client.ts` | None |
| 2 | `context/AuthContext.tsx` | Supabase auth |
| 3 | `SignInPage.tsx` | AuthContext |
| 4 | `SignUpPage.tsx` | AuthContext |
| 5 | `Navbar.tsx` | AuthContext |
| 6 | `MyNotebookPage.tsx` | `notebook_entries` table |
| 7 | `ExplorePage > LetterSection` | `notebook_entries` INSERT + `count_community_letters` RPC |
| 8 | `ExplorePage > NonResumeSection` | `notebook_entries` INSERT |
| 9 | `StoriesPage.tsx` | `stories` table |
| 10 | `FeedbackPage.tsx` | `feedback` table |
| 11 | `LandingPage.tsx` (community wall) | `stories` SELECT |
| 12 | `LandingPage.tsx` (impact receipt) | Decision: keep hardcoded |
| 13 | `CheckInPage` + `CheckOutPage` survey URLs | External platform only |
| 14 | `CheckOutPage` reflection save | `notebook_entries` INSERT (optional) |
| 15 | Add `/before-it-breaks` route | None |
| 16 | New `ProfilePage.tsx` | `profiles` table |
