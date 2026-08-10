# Voice OS Hackathon — Parallel Session Prompts

> **Running overnight with no human?** Skip to "Overnight mode" at the bottom —
> it replaces Prompts 1–4 with two unattended-safe prompts and a pre-sleep
> checklist. The prompts below assume a human is available for auth steps and
> Xcode clicks.

One prompt per computer/Claude session. Coordination rules (apply to every session):

- Everyone works on branch **`voice-os-hackathon`** (`git fetch && git checkout voice-os-hackathon`). Read `VOICE_OS_PLAN.md` first — it is the source of truth.
- **Disjoint directories** so merges stay trivial: Backend owns `api/`, `supabase/`, `requirements.txt`, `vercel.json`. iOS owns `ios/`. Web owns `src/`. Integrations owns `integrations/`. Don't edit outside your lane; if you must, coordinate first.
- `git pull --rebase` before every push; push early and often (small commits).
- The backend session posts the deployed base URL + a test API key to the group as soon as Phase 3 lands. Until then, other sessions build against the endpoint contract in VOICE_OS_PLAN.md Phase 2's route table.
- Cut scope per the plan, not silently: goals, trusted contacts, safety classifier, pgvector are already out; MCP is stretch.

---

## Prompt 1 — Backend (Computer A: Phases 1–3, ~3.5h)

```
You're building the backend track of the Voice OS hackathon for Dear Future Me.
Check out branch voice-os-hackathon and read VOICE_OS_PLAN.md in full — execute
Phases 1, 2, and 3 exactly as specified there (migrations → FastAPI service →
Vercel deploy + letter-delivery cron). The plan's §0.3 "Allowed APIs" facts were
verified against live docs on 2026-08-08 — trust them over your training data or
old tutorials, and respect every anti-pattern guard listed per phase.

Your lane: api/, supabase/, requirements.txt, vercel.json. Do not touch src/ or
integrations/.

Order of work: Phase 1 migrations (codify drift FIRST — the live DB has columns
no migration creates), apply via supabase CLI or give me SQL to paste in the
dashboard. Then Phase 2 FastAPI (api/index.py + api/_lib/*) with the exact route
table from the plan; run it locally with uvicorn against the real Supabase project
(creds in supabase/.env) and curl-test every route including the negative cases
(401 without key, cross-user 404, DELETE without confirm=true → 400). Then Phase 3:
deploy to Vercel, run the 15-minute routing spike, wire the deliver-letters cron
with CRON_SECRET, and verify openapi.json has servers + ApiKeyAuth in production.

I'm available for the user actions listed in the plan (Vercel login, env vars,
choosing the Supabase project). When done: commit, push, and post the production
base URL plus one freshly minted test API key so the iOS, web, and integrations
sessions can go live. If a POST /v1/keys UI doesn't exist yet, mint the test key
with a one-off script against the api_keys table (hash per the plan's D4 spec).
```

## Prompt 2 — iOS app (Computer B: Phases 6–8, ~3.5h; needs Xcode + an iPhone)

```
You're building the iOS track of the Voice OS hackathon for Dear Future Me.
Check out branch voice-os-hackathon and read VOICE_OS_PLAN.md in full — you own
Phases 6, 7, and 8 (SwiftUI voice app → Claude tool-calling agent → widget +
App Intents). The plan's §0.3 iOS facts (SFSpeechRecognizer pattern, WidgetKit
types, Claude Messages API wire shape, free-account signing limits) were verified
against Apple/Anthropic docs on 2026-08-08 — follow them and the per-phase
anti-pattern guards (especially: widgetURL not Button(intent:) for launching;
no tool-selection logic in views; .playAndRecord audio session or TTS goes silent).

Your lane: create everything under ios/ (Xcode project DearFutureMe + DFMWidget
extension target). Do not touch api/ or src/.

Prereqs on this machine (tell me immediately if missing): Xcode installed, my
Apple ID added as Personal Team, iPhone with Developer Mode on. Guide me through
every Xcode GUI step explicitly (menu paths are in the plan) since you can't
click them — write all Swift files yourself and tell me exactly where each goes.

Order of work: Phase 6 scaffold + get live STT partials and TTS working ON THE
REAL DEVICE before anything else (front-load signing pain). Phase 7 agent loop:
until the backend session posts the production URL and a test API key, build
against a DFMConfig.baseURL constant and stub tool executors returning canned
JSON — swap to live as soon as the URL arrives. Model: claude-haiku-4-5. The
acceptance test is the 5-moment demo script in VOICE_OS_PLAN.md's TL;DR (§27).
Phase 8: launcher widget (home + lock screen) deep-linking dearfutureme://talk
into an already-listening session, plus AppShortcutsProvider Siri phrases.
Commit and push after each phase.
```

## Prompt 3 — Web API-keys page (Computer C: Phase 4, ~45 min)

```
You're building the web track of the Voice OS hackathon for Dear Future Me.
Check out branch voice-os-hackathon and read VOICE_OS_PLAN.md — you own Phase 4:
a /developer page where a signed-in user creates, views (hint only), and revokes
DFM API keys.

Your lane: src/ only (new src/pages/ApiKeysPage.tsx + a route line in src/App.tsx
+ a navbar link). Do not touch api/ or supabase/.

The page calls the key-management endpoints from the plan's Phase 2 route table
(POST /v1/keys, GET /v1/keys, POST /v1/keys/{id}/revoke) with
Authorization: Bearer <supabase session access_token> — get the session via the
existing AuthContext / supabase client. Until the backend session posts the
production URL, develop against a VITE_DFM_API_URL env var defaulting to
http://localhost:8000 and mock fetch responses; wire live once the URL arrives.

Non-negotiable design rules are in DESIGN_SYSTEM.md §17 (cream #F9F5ED never
white, green-tinted text, rounded-2xl, Comfortaa+Caveat, reuse existing
src/components/ui/* verbatim). Copy the soft-gate pattern from MyNotebookPage.tsx
for signed-out users, and FeedbackPage.tsx as the simplest page scaffold.
The raw key renders exactly once at creation in a copy box. npm run typecheck
and npm run lint must pass. Commit and push when green.

If you finish early: pull the latest plan and start Phase 5's static prep in
integrations/ (ChatGPT GPT setup README + Gemini function_declarations.json) —
those only need the endpoint contract, not the live API.
```

## Prompt 4 — External AI integrations (Computer C or D: Phase 5, ~45 min; starts after backend deploys)

```
You're building the integrations track of the Voice OS hackathon for Dear Future
Me. Check out branch voice-os-hackathon and read VOICE_OS_PLAN.md — you own
Phase 5: making ChatGPT and Gemini actually use the deployed DFM API, MCP as
stretch only.

Your lane: integrations/ only.

Inputs you need from the backend session: the production base URL and a test API
key. Then: (1) integrations/chatgpt/README.md with the exact click-path to create
the custom GPT (import openapi.json by URL, API-key auth with Custom header
x-api-key) plus 6 test prompts matching the demo script — walk me through creating
it in my OpenAI account and verify a round-trip lands a row with source='api'.
(2) integrations/gemini/function_declarations.json using ONLY the schema subset
Gemini supports (listed in the plan §0.3) + a runnable demo.py using the
google-genai SDK dispatching to the API via httpx. (3) integrations/README.md as
the one-page judge handout. (4) MCP ONLY if everything else is green: mcp v2.0.0
package — FastMCP is renamed MCPServer, old tutorials are stale; if serverless
sessions misbehave, demo locally with the MCP inspector and stop there.
Commit and push after each artifact.
```

## Prompt 5 — Tomorrow's review (any computer, morning)

```
Check out voice-os-hackathon in dear-future-me and read VOICE_OS_PLAN.md Phase 9
plus HANDOFF.md if it exists. Run every Phase 9 verification gate cold: the grep
gates, the cross-user isolation curl test, the openapi.json contract check,
typecheck + lint. Then run /code-review on the branch. Compile a prioritized fix
list separating demo-blocking from post-hackathon, apply the demo-blocking fixes,
and finish with a full rehearsal checklist for the 5-moment demo including the
web-notebook reveal. Explicit review items from the plan: keys in UserDefaults,
the baked Claude key, deliver-letters idempotency, and whether the RLS-hole
closures broke any workshop page.
```

---

# Overnight mode (2 computers, zero interaction, user asleep)

## Pre-sleep checklist (~10 min — this decides how much gets done tonight)

1. **Start the Xcode install from the App Store on the iOS machine and leave it downloading.** Nothing overnight needs Xcode, but tomorrow morning starts dead without it.
2. On the backend computer, authenticate everything the session will need so it never blocks:
   - `npm i -g vercel && vercel login && vercel link` (link the existing DFM project)
   - `supabase login` (or put the DB connection string / password where the session can use `supabase db push`)
   - Add Vercel env vars now (dashboard or `vercel env add`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `DFM_PUBLIC_URL`
3. Launch both sessions with auto-accepted permissions (e.g. `claude --dangerously-skip-permissions`) — otherwise they stall on the first Bash/Write prompt. Hackathon-acceptable risk on these two lanes.
4. Both computers: `git fetch && git checkout voice-os-hackathon` first.

## Overnight Prompt A — backend computer

```
You're running UNATTENDED overnight — I'm asleep and cannot answer questions,
approve anything, or log into anything. Never stop to ask; when blocked, write
the blocker + exact morning steps into MORNING_RUNBOOK.md and route around it.
Commit and push (git pull --rebase first) after every completed chunk so the
other computer sees your work.

Check out branch voice-os-hackathon in dear-future-me and read VOICE_OS_PLAN.md
in full. Then, in order:

1. Phases 1–3 (migrations → FastAPI → deploy + deliver-letters cron) exactly as
   specified, including anti-pattern guards. Auth for supabase CLI and vercel
   should already be set up — verify with `supabase projects list` and
   `vercel whoami` before relying on them. If migrations genuinely cannot be
   applied, put the SQL in the runbook and integration-test against a local
   stack (`supabase start` if Docker is available) or fall back to unit tests
   with a faked supabase client — but exhaust the real options first.
2. If deploy succeeded: run the full Phase 3 verification, then mint a test API
   key via a one-off script (hash per plan D4), and write the production base
   URL + test key into MORNING_RUNBOOK.md.
3. Phase 5 static prep in integrations/: chatgpt/README.md click-path,
   gemini/function_declarations.json + demo.py, judge-facing README.md. If the
   API is deployed, verify demo.py end-to-end against production yourself.
4. Write integrations/tests.sh: the Phase 9 curl gates (auth negative cases,
   cross-user isolation, openapi.json contract check) runnable in one command.
5. Finish MORNING_RUNBOOK.md: what's deployed, what's verified, exact remaining
   human steps (ChatGPT GPT creation clicks, anything you couldn't do), and any
   deviations from the plan.

Your lane: api/, supabase/, integrations/, vercel.json, requirements.txt,
MORNING_RUNBOOK.md. Never touch src/ or ios/ — the other computer owns those.
```

## Overnight Prompt B — second computer (iOS source + web page)

```
You're running UNATTENDED overnight — I'm asleep and cannot answer questions or
click anything. Never stop to ask; log blockers in IOS_RUNBOOK.md and continue.
Commit and push (git pull --rebase first) after every completed chunk.

Check out branch voice-os-hackathon in dear-future-me and read VOICE_OS_PLAN.md
in full. Xcode is NOT available tonight, so nothing you write can be compiled —
optimize for compile-on-first-try: plain SwiftUI, exact API names from the
plan's §0.3 (they were verified against Apple docs), no clever abstractions,
no third-party packages.

1. Write the COMPLETE iOS source tree under ios/ as loose Swift files (no
   .xcodeproj — that gets created by hand tomorrow): all Phase 6–8 files
   (DearFutureMeApp, VoiceSessionView, SpeechRecognizer, Speaker, Theme,
   AgentLoop, DFMTools, DFMConfig, TalkIntent + AppShortcuts, and the DFMWidget
   extension files), per the plan's per-phase specs and anti-pattern guards.
   Base URL and keys live in DFMConfig with obvious TODO markers; tool
   executors hit the real /v1 contract from the plan's Phase 2 route table.
2. Write ios/IOS_RUNBOOK.md: the exact Xcode assembly sequence for tomorrow
   (project creation settings, which file lands in which target, Info entries
   incl. mic/speech permission strings and the dearfutureme URL scheme, widget
   target creation with "Include Configuration App Intent" unchecked, signing
   with Personal Team, device steps), plus a 10-step on-device test script
   ending in the 5-moment demo.
3. Then Phase 4 (src/ApiKeysPage.tsx + route + navbar link) per the plan — this
   one you CAN verify: npm run typecheck and npm run lint must pass. Use
   VITE_DFM_API_URL with a localhost default; if MORNING_RUNBOOK.md appears on
   the branch with a production URL (pull to check late in your run), wire it.
4. If time remains: a polish pass on both against DESIGN_SYSTEM.md §17
   non-negotiables, and a HANDOFF note listing anything uncertain for review.

Your lane: ios/, src/, IOS_RUNBOOK.md. Never touch api/, supabase/, or
integrations/ — the other computer owns those.
```

## What still needs awake-you tomorrow (unavoidable)

- Xcode project assembly + signing + first device run (runbook-guided, ~45 min)
- Speaking the demo: STT/TTS/agent loop can only be tested by a human with a mic
- ChatGPT custom GPT creation (your OpenAI account, ~10 min of clicks)
- Anthropic API key into DFMConfig; DFM key minted on the /developer page
- Anything MORNING_RUNBOOK.md flags (e.g. migrations if CLI auth wasn't set up)
