# Dear Future Me — Codebase Audit

> Generated 2026-05-12. Source of truth for Phase 4 rebuild.

---

## Table of Contents
1. [Routing Map](#routing-map)
2. [Pages](#pages)
3. [Components](#components)
4. [Contexts](#contexts)
5. [Database Schema](#database-schema)
6. [Supabase Edge Functions](#supabase-edge-functions)
7. [Backend / API](#backend--api)
8. [Known Issues & Notes](#known-issues--notes)

---

## Routing Map

| Route | Component | Auth Required |
|---|---|---|
| `/` | `Welcome` | No |
| `/survey` | `Survey type="pre"` | No |
| `/post-survey` | `Survey type="post"` | No |
| `/explore/*` | `Explore` (nested routes below) | No |
| `/explore/accomplishments` | `AccomplishmentFeed` | No |
| `/explore/vision-board` | `VisionBoard` | No |
| `/explore/letter` | `LetterToSelf` | No (optional auth) |
| `/thank-you` | `Exit` | No |
| `/testimonials/` | `Testimonials → TestimonialsList` | No |
| `/testimonials/new` | `Testimonials → NewTestimonial` | No (optional auth) |
| `/about` | `About` | No |
| `/feedback` | `Feedback` | No |
| `/thanksgiving` | `Thanksgiving` | No |
| `/admin` | `Admin` | No (password: `admin123` — hardcoded, insecure) |
| `/dashboard` | `Dashboard` | **Yes** (ProtectedRoute) |
| `/journal` | `Journal` | **Yes** (ProtectedRoute) |
| `/surveys` | `Surveys` | **Yes** (ProtectedRoute) |
| `/profile` | `Profile` | **Yes** (ProtectedRoute) |

---

## Pages

### `Welcome` (`/`)
- **Reads:** `letter_counts` (SELECT `copy_count`, LIMIT 1)
- **Writes:** `letter_counts` (INSERT `{ copy_count: 56 }` if no record exists)
- **State:** `showAuthModal`, `letterCount`
- **Functions:** `fetchLetterCount()`
- **Notes:** Displays community stats (hardcoded: 250+ letters, 1500+ members, 650+ stories). Shows "Get Started" → `/survey` for guests, → `/dashboard` for logged-in users.

### `Survey` (`/survey`, `/post-survey`)
- **Props:** `type: 'pre' | 'post'`
- **Reads:** Nothing (no Supabase)
- **Writes:** Nothing (no Supabase)
- **State:** None
- **Functions:** `handleOpenSurvey()`, `handleContinue()`
- **Notes:** Opens external QuestionPro surveys in a new tab. Pre-survey navigates to `/explore`; post-survey navigates to `/thank-you`.

### `Explore` (`/explore/*`)
- **Reads/Writes:** Delegated entirely to child components
- **State:** None (reads `useLocation`)
- **Functions:** None
- **Notes:** Tab shell wrapping `AccomplishmentFeed`, `VisionBoard`, `LetterToSelf`. Redirects `/explore` → `/explore/accomplishments`.

### `Dashboard` (`/dashboard`) — Protected
- **Reads:**
  - `journals` — SELECT `journal_id, title, entry_date, content` WHERE `user_id = user.id` ORDER BY `entry_date DESC` LIMIT 3
  - `journals` — COUNT WHERE `user_id = user.id`
  - `letters` — SELECT `id, text, created_at` WHERE `user_id = user.id` ORDER by `created_at DESC` LIMIT 3
  - `letters` — COUNT WHERE `user_id = user.id`
- **Writes:** Nothing
- **State:** `stats: { journalCount, letterCount, recentJournals, recentLetters }`, `loading`
- **Functions:** `fetchDashboardData()`
- **Notes:** Quick actions link to `/explore`, `/testimonials/new`, `/feedback`, `/about`.

### `Journal` (`/journal`) — Protected
- **Reads:** `journals` — SELECT `*` WHERE `user_id = user.id` ORDER BY `entry_date DESC`
- **Writes:**
  - INSERT: `{ user_id, title, content, is_public }`
  - UPDATE: `{ title, content, is_public, updated_at }` WHERE `journal_id`
  - DELETE: WHERE `journal_id`
- **State:** `entries`, `loading`, `showForm`, `editingEntry`, `formData: { title, content, is_public }`, `submitting`
- **Functions:** `fetchEntries()`, `handleSubmit()`, `handleEdit()`, `handleDelete()`, `cancelForm()`

### `Surveys` (`/surveys`) — Protected
- **Reads:** Nothing (no Supabase)
- **Writes:** Nothing (no Supabase)
- **State:** None
- **Notes:** Dashboard view of both survey links. Pure informational page.

### `Testimonials` (`/testimonials/*`)
- **Sub-component `TestimonialsList`:**
  - **Reads:** `testimonials` — SELECT `*` WHERE `is_approved = true` ORDER BY `created_at DESC`
  - **State:** `testimonials`, `loading`
- **Sub-component `NewTestimonial`:**
  - **Writes:** `testimonials` — INSERT `{ user_id, testimonial_content, author_name, is_approved: true }`
  - **State:** `content`, `authorName`, `submitting`, `success`
  - **Note:** `is_approved` is hardcoded `true` on insert — testimonials are immediately public.

### `Profile` (`/profile`) — Protected
- **Reads:** `profiles` — SELECT `*` WHERE `id = user.id` SINGLE
- **Writes:** `profiles` — UPSERT `{ id, name, email, phone, notifications_enabled, updated_at }`
- **State:** `profileData: { name, email, phone, notifications_enabled }`, `loading`, `saving`, `editing`, `success`
- **Functions:** `fetchProfile()`, `handleSave()`

### `Admin` (`/admin`)
- **Authentication:** Hardcoded password check (`admin123`) — **not using Supabase auth**
- **Reads:** `accomplishments` COUNT, `vision_boards` COUNT, `letters` COUNT
- **Writes:** None (read-only admin view)
- **Functions:** `handleLogin()`, `fetchDataCounts()`, `downloadData(table)` — exports CSV
- **State:** `isAuthenticated`, `password`, `error`, `dataCounts`, `isLoading`

### `Feedback` (`/feedback`)
- **Reads:** Nothing
- **Writes:** `feedback` — INSERT `{ feedback_content, category, email }`
- **State:** `formData: { content, category, email }`, `submitting`, `success`, `error`
- **Categories:** `general`, `suggestion`, `bug`, `support`

### `Exit` (`/thank-you`)
- **Reads/Writes:** Nothing (no Supabase)
- **Notes:** Static page with local mental health resource listings (Dublin, CA area).

### `About` (`/about`)
- **Reads/Writes:** Nothing (no Supabase)
- **Notes:** Static team bio page. Founder photos hosted on Imgur.

### `Thanksgiving` (`/thanksgiving`)
- **Reads/Writes:** Delegated to `CommunitySubmissionFeed` with `tableName="thanksgiving_gratitude"`
- **Notes:** Contains 21 hardcoded `staticEntries` (gratitude examples) merged with live DB entries.

---

## Components

### `NavBar`
- **Props:** None
- **Reads:** `useAuth()` (user), `useTheme()` (theme), `useLocation()`
- **Writes:** Calls `signOut()`
- **State:** `showAuthModal`, `authMode`, `mobileMenuOpen`
- **Notes:** Hidden on `/` (welcome page). Shows different nav items for authenticated vs anonymous users.

### `AuthModal`
- **Props:** `isOpen: boolean`, `onClose: () => void`, `initialMode?: 'signin' | 'signup'`
- **Reads:** None
- **Writes:** Calls `signUp(email, password, name)`, `signIn(email, password)`, `signInWithGoogle()`
- **State:** `mode`, `email`, `password`, `name`, `loading`, `error`

### `ProtectedRoute`
- **Props:** `children: ReactNode`
- **Notes:** Redirects to `/` if not authenticated.

### `CommunitySubmissionFeed`
- **Props:**
  - `tableName: 'accomplishments' | 'thanksgiving_gratitude'`
  - `title, description, textareaLabel, placeholder, submitButtonLabel: string`
  - `emptyState?: string`
  - `listTitle, entryNoun: string`
  - `icon?: ReactNode`
  - `staticEntries?: string[]`
- **Reads:** `[tableName]` — SELECT `*` ORDER BY `created_at DESC`
- **Writes:**
  - INSERT `{ content, delete_key: randomKey }` into `[tableName]`
  - DELETE WHERE `delete_key = [key]` from `[tableName]`
- **State:** `submissions`, `newSubmission`, `deleteKey`, `isSubmitting`, `error`, `showCopyPopup`, `copied`, `showDeletePrompt`, `deletePromptKey`, `itemToDelete`
- **Functions:** `fetchSubmissions()`, `handleSubmit()`, `initiateDelete()`, `handleDelete()`, `handleCopy()`
- **Notes:** Shows a copy-key modal after insert so user can delete later. Merges `staticEntries` (rendered without delete button) with live DB entries.

### `AccomplishmentFeed`
- **Props:** None
- **Notes:** Thin wrapper around `CommunitySubmissionFeed` targeting `accomplishments` table.

### `LetterToSelf`
- **Props:** None
- **Reads:** `letter_counts` — SELECT `copy_count` LIMIT 1
- **Writes:**
  - `letters` — INSERT `{ text, user_id? }` (user_id only if authenticated)
  - `letter_counts` — RPC `increment_letter_count()` (called when user copies letter)
- **State:** `letterContent`, `isSubmitting`, `success`, `error`, `wordCount`, `showCopyPopup`, `copied`, `letterCount`
- **Functions:** `fetchLetterCount()`, `incrementLetterCount()`, `handleChange()`, `handleSave()`, `handleCopy()`

### `VisionBoard`
- **Props:** None
- **Reads/Writes:** Nothing (no Supabase)
- **Notes:** Static instructions page for making a vision board in Google Slides or Canva. Links to an external Padlet. Second card is a "Coming Soon" placeholder.

### `TabNavigation`
- **Props:** `tabs: Array<{ id, label, path }>`
- **Notes:** Renders tab links; active state driven by `useLocation`.

### `Card`
- **Props:** `className?`, `title?`, `children`
- **Notes:** Presentational wrapper.

### `Button`
- **Props:** `variant?`, `size?`, `isLoading?`, `fullWidth?`, `type?`, `onClick?`, `disabled?`, `className?`, `children`
- **Notes:** Presentational button component.

### `LoadingSpinner`
- **Props:** `size?`, `className?`

### `Footer`
- **Props:** None
- **Reads/Writes:** Nothing

### `ResourceLink`
- **Props:** `title`, `address`, `phone`, `services`
- **Notes:** Used only in `Exit` page.

### `SurveyEmbed`
- **Notes:** File exists but is not imported anywhere — unused component.

---

## Contexts

### `AuthContext`
- **Provides:** `user`, `session`, `loading`, `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `updateProfile`
- **Supabase calls:**
  - `supabase.auth.getSession()`
  - `supabase.auth.onAuthStateChange()`
  - `supabase.auth.signUp({ email, password, options: { data: { name } } })`
  - `supabase.auth.signInWithPassword({ email, password })`
  - `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/dashboard' } })`
  - `supabase.auth.signOut()`
  - `profiles` — UPDATE `{ name }` WHERE `id = user.id` (via `updateProfile`)
- **Note:** `updateProfile` is defined but never called from any page/component; `Profile.tsx` directly calls `supabase.from('profiles').upsert(...)` instead.

### `ThemeContext`
- **Provides:** `theme` (color palette object)
- **Notes:** Theme object is static; only `NavBar` consumes `theme.colors.darkGreen`.

---

## Database Schema

### Table: `accomplishments`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `content` | `text` | NOT NULL |
| `delete_key` | `text` | nullable |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**RLS Policies:**
- `Anyone can read accomplishments` — SELECT, anon + authenticated, USING `true`
- `Anyone can insert accomplishments` — INSERT, anon + authenticated, WITH CHECK `true`
- `Allow deletion with key` — DELETE, anon + authenticated, USING `true`

**Triggers:**
- `check_profanity_trigger` BEFORE INSERT — calls `check_profanity()` to block profanity in `content`

---

### Table: `thanksgiving_gratitude`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `content` | `text` | NOT NULL |
| `delete_key` | `text` | nullable |
| `created_at` | `timestamptz` | DEFAULT `timezone('utc', now())` |

**RLS Policies:**
- `Anyone can read thanksgiving gratitude` — SELECT, anon + authenticated, USING `true`
- `Anyone can insert thanksgiving gratitude` — INSERT, anon + authenticated, WITH CHECK `true`
- `Allow thanksgiving gratitude deletion with key` — DELETE, anon + authenticated, USING `true`

**Triggers:**
- `check_profanity_thanksgiving` BEFORE INSERT — calls `check_profanity()`

---

### Table: `letters`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `text` | `text` | NOT NULL |
| `user_id` | `uuid` | nullable, FK → `auth.users(id)` ON DELETE CASCADE |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**RLS Policies:**
- `Anyone can insert letters` — INSERT, anon + authenticated, WITH CHECK `true`
- `Users can read own letters` — SELECT, authenticated, USING `auth.uid() = user_id`
- `Anyone can read anonymous letters` — SELECT, anon + authenticated, USING `user_id IS NULL`

---

### Table: `vision_boards`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `icons` | `jsonb` | NOT NULL |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**RLS Policies:**
- `Anyone can read vision_boards` — SELECT, anon + authenticated, USING `true`
- `Anyone can insert vision_boards` — INSERT, anon + authenticated, WITH CHECK `true`

**Notes:** The `VisionBoard` component does not read or write this table. The table is only queried by the `Admin` page for counts/export. Schema is orphaned from the current frontend.

---

### Table: `profiles`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users` ON DELETE CASCADE |
| `name` | `text` | nullable |
| `email` | `text` | nullable |
| `phone` | `text` | nullable (added later via migration) |
| `notifications_enabled` | `boolean` | DEFAULT `true` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

**RLS Policies:**
- `Users can view own profile` — SELECT, authenticated, USING `auth.uid() = id`
- `Users can update own profile` — UPDATE, authenticated, USING `auth.uid() = id`
- `Users can insert own profile` — INSERT, authenticated, WITH CHECK `auth.uid() = id`

**Triggers:**
- `on_auth_user_created` AFTER INSERT on `auth.users` — calls `handle_new_user()` to auto-create profile row

---

### Table: `journals`
| Column | Type | Constraints |
|---|---|---|
| `journal_id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users` ON DELETE CASCADE |
| `entry_date` | `timestamptz` | DEFAULT `now()` |
| `title` | `text` | nullable |
| `content` | `text` | NOT NULL |
| `is_public` | `boolean` | DEFAULT `false` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

**RLS Policies:**
- `Users can view own journals` — SELECT, authenticated, USING `auth.uid() = user_id`
- `Users can view public journals` — SELECT, authenticated + anon, USING `is_public = true`
- `Users can insert own journals` — INSERT, authenticated, WITH CHECK `auth.uid() = user_id`
- `Users can update own journals` — UPDATE, authenticated, USING `auth.uid() = user_id`
- `Users can delete own journals` — DELETE, authenticated, USING `auth.uid() = user_id`

---

### Table: `testimonials`
| Column | Type | Constraints |
|---|---|---|
| `testimonial_id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `user_id` | `uuid` | nullable, FK → `auth.users` ON DELETE SET NULL |
| `testimonial_content` | `text` | NOT NULL |
| `author_name` | `text` | nullable |
| `is_approved` | `boolean` | DEFAULT `false` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**RLS Policies:**
- `Anyone can view approved testimonials` — SELECT, authenticated + anon, USING `is_approved = true`
- `Users can insert testimonials` — INSERT, authenticated + anon, WITH CHECK `true`
- `Users can view own testimonials` — SELECT, authenticated, USING `auth.uid() = user_id`

**Note:** The application hardcodes `is_approved: true` on all new inserts (no moderation flow).

---

### Table: `feedback`
| Column | Type | Constraints |
|---|---|---|
| `feedback_id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `submitted_at` | `timestamptz` | DEFAULT `now()` |
| `feedback_content` | `text` | NOT NULL |
| `category` | `text` | DEFAULT `'general'` |
| `email` | `text` | nullable |

**RLS Policies:**
- `Anyone can insert feedback` — INSERT, authenticated + anon, WITH CHECK `true`
- *(No SELECT policy — feedback is write-only from the frontend)*

---

### Table: `letter_counts`
| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` |
| `copy_count` | `integer` | DEFAULT `0` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

**RLS Policies:**
- `Anyone can insert letter counts` — INSERT, anon + authenticated, WITH CHECK `true`
- `Anyone can update letter counts` — UPDATE, anon + authenticated, USING `true`, WITH CHECK `true`
- `Anyone can view letter counts` — SELECT, anon + authenticated, USING `true`

---

### Database Functions

| Function | Description |
|---|---|
| `handle_new_user()` | Trigger function: inserts a new row in `profiles` on `auth.users` INSERT |
| `increment_letter_count()` | Updates the first `letter_counts` row: `copy_count + 1` |
| `check_profanity()` | Trigger function: raises exception if `content` matches a word blocklist |
| `set_claim(name text, value text)` | Sets `app.[name]` session config (used for delete-key RLS — currently the policy is `USING true` so this is vestigial) |

---

## Supabase Edge Functions

### `send-weekly-reminders`
- **Trigger:** HTTP (intended to be called by a cron)
- **Logic:** Checks if current time is Friday at 3 PM; if so, queries `profiles` WHERE `notifications_enabled = true AND phone IS NOT NULL` and logs/queues SMS messages
- **Reads:** `profiles` — SELECT `phone, name` WHERE `notifications_enabled = true` AND `phone IS NOT NULL`
- **Writes:** Nothing (Twilio integration is commented out — currently only `console.log`)
- **Status:** SMS sending is a stub — not functional.

### `send-email`
- File exists at `supabase/functions/send-email/index.ts` but was not audited (not referenced anywhere in `src/`).

---

## Backend / API

### `api/cron/seed-accomplishments.js`
- **Purpose:** Vercel cron job that inserts a daily sample accomplishment into the `accomplishments` table
- **Schedule:** Defined in `vercel.json` (exact schedule not audited)
- **Reads:** Nothing
- **Writes:** `accomplishments` — INSERT `{ content: <sample>, created_at }`

---

## Hook Signatures

There is no `src/hooks/` directory. All custom hooks are exported directly from context files.

### `useAuth()` — `src/contexts/AuthContext.tsx`
```ts
function useAuth(): AuthContextType

interface AuthContextType {
  user: User | null;           // Supabase User object (from @supabase/supabase-js)
  session: Session | null;     // Supabase Session object
  loading: boolean;            // true while initial session is being resolved
  signUp: (email: string, password: string, name: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string }) => Promise<{ data: any; error: any } | { error: string }>;
}
```
- **Must be called inside `<AuthProvider>`** (throws if not)
- `loading` starts `true` and flips to `false` after `supabase.auth.getSession()` resolves on mount
- `updateProfile` returns `{ error: 'No user logged in' }` (string, not Error object) if called when `user` is null
- **Never called in the codebase:** `updateProfile` — pages call Supabase directly instead

### `useTheme()` — `src/contexts/ThemeContext.tsx`
```ts
function useTheme(): { theme: Theme }

const theme = {
  colors: {
    darkGreen: '#1B4332',
    lightGreen: '#95D5B2',
    mediumGreen: '#40916C',
    paleGreen: '#D8F3DC',
    accent: '#FF7F50',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    background: '#F5F7F5',
    card: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#4B5563',
    border: '#E5E7EB',
  },
  fonts:        { primary: '"Inter", sans-serif' },
  shadows:      { sm, md, lg }          // standard box-shadow strings
  spacing:      { base: '8px' },
  borderRadius: { sm, md, lg, full },
  animation:    { fast: '150ms', normal: '300ms', slow: '500ms' },
}
```
- **Must be called inside `<ThemeProvider>`** (throws if not)
- Theme is **static** — no setter, no toggling. Only `NavBar` actually uses `theme.colors.darkGreen`; everywhere else uses Tailwind directly.
- In Phase 4, this context can likely be removed entirely in favor of Tailwind CSS variables.

---

## Auth Flow

### Step-by-step: signup / email+password login → protected page

1. **User opens `/`** (`Welcome.tsx`) and clicks "Create Account" or "Sign In."
2. **`AuthModal` renders** — a modal with email/password fields (and Google OAuth button).
3. **On form submit:**
   - Signup: calls `AuthContext.signUp(email, password, name)` → `supabase.auth.signUp({ email, password, options: { data: { name } } })`
   - Sign-in: calls `AuthContext.signIn(email, password)` → `supabase.auth.signInWithPassword({ email, password })`
4. **Supabase responds** with `{ data: { user, session }, error }`.
   - On error: modal shows `error.message`, stays open.
   - On success: modal closes; `AuthModal` clears form state.
5. **`supabase.auth.onAuthStateChange` fires** (listener set up in `AuthContext` `useEffect` on mount) with event `SIGNED_IN` and the new session.
6. **`AuthContext` updates state:** `setSession(session)`, `setUser(session.user)`, `setLoading(false)`.
7. **All components consuming `useAuth()` re-render** with the new `user` value (non-null).
8. **`ProtectedRoute` re-evaluates:** `loading` is false, `user` is non-null → renders `children`.
9. **On signup only:** the `on_auth_user_created` DB trigger fires server-side, inserting a new row into `profiles` with `{ id: user.id, name: user.raw_user_meta_data.name, email: user.email }`.

---

### Step-by-step: Google OAuth

1. User clicks "Google" button in `AuthModal`.
2. Calls `AuthContext.signInWithGoogle()` → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })`.
3. Browser **redirects to Google** for OAuth consent.
4. After consent, Google redirects back to `[origin]/dashboard` with a token in the URL hash.
5. Supabase JS client intercepts the hash on page load, exchanges it for a session, and fires `onAuthStateChange` with `SIGNED_IN`.
6. `AuthContext` sets `user` and `session` → same as steps 6–9 above.

---

### Session persistence across page loads

1. On `AuthProvider` mount, `supabase.auth.getSession()` is called immediately.
2. Supabase reads the session from `localStorage` (key: `sb-[project-ref]-auth-token`).
3. If a valid (non-expired) session exists, `setUser` / `setSession` are called with it and `loading` → `false`.
4. If the access token is expired but a refresh token exists, Supabase auto-refreshes silently before resolving.
5. If no session, `user` stays `null`, `loading` → `false`.

---

### How `ProtectedRoute` checks auth

```
ProtectedRoute
  ├── loading === true  →  renders <LoadingSpinner> (blocks render until session resolved)
  ├── user === null     →  renders inline "Authentication Required" card + <AuthModal>
  │                         (does NOT redirect — user stays on the URL they navigated to)
  └── user !== null     →  renders children
```

**Key design note:** `ProtectedRoute` does **not** use `<Navigate>` to redirect to a login page. It renders an inline prompt with a "Sign In" button that opens `AuthModal`. After signing in via the modal, `AuthContext` updates, `ProtectedRoute` re-renders, and children appear — all without a page navigation.

---

### Sign-out flow

1. User clicks "Sign Out" in `NavBar`.
2. `handleSignOut()` calls `AuthContext.signOut()` → `supabase.auth.signOut()`.
3. Supabase clears the session from `localStorage` and fires `onAuthStateChange` with `SIGNED_OUT`.
4. `AuthContext` sets `user = null`, `session = null`.
5. All protected pages re-render into the "Authentication Required" state.
6. NavBar re-renders to show "Sign In / Sign Up" buttons instead of "Profile / Sign Out."
7. User is **not navigated away** — they stay on the current URL (e.g., `/dashboard` now shows the auth prompt).

---

## Known Issues & Notes

1. **Admin password is hardcoded** (`admin123` in `Admin.tsx:29`) — not using Supabase auth at all.
2. **`SurveyEmbed` component is unused** — imported nowhere, dead code.
3. **`AuthContext.updateProfile` is never called** — `Profile.tsx` bypasses it and directly calls `supabase.from('profiles').upsert(...)`.
4. **`vision_boards` table is orphaned** — the `VisionBoard` component no longer reads or writes it; only `Admin` queries it for counts.
5. **`send-weekly-reminders` SMS is a stub** — Twilio code is commented out; reminders are never actually sent.
6. **Testimonials auto-approved** — `is_approved` is hardcoded `true` on insert; moderation flow exists in DB but not in UI.
7. **`set_claim` function is vestigial** — the accomplishment delete policy was changed to `USING true`, so the claim-based RLS is no longer used.
8. **Letter count upsert conflict** — migration `20250609044844` attempts `ON CONFLICT (id)` on `letter_counts`, but there is no unique constraint named `id` set as the conflict target; the `id` column is the PK so this works, but the migration also has a duplicate `DO $$` block that re-sets the count.
9. **Community stats on Welcome page are hardcoded** — "250+ Letters", "1,500+ Members", "650+ Stories" are static strings, not real DB counts.
10. **`profiles` missing `phone` and `notifications_enabled` in initial migration** — these columns were added in a later migration; old profiles may lack them.
