# VOICE OS HACKATHON PLAN — DFM API-First + Voice-First iPhone Agent

Branch: `voice-os-hackathon` · Written: 2026-08-08 (evening) · Build window: tonight · Review: tomorrow
All platform facts below were verified against live official docs on 2026-08-08 (sources cited inline). Repo facts verified against this working tree.

---

## TL;DR

Two deliverables, built as one system:

1. **DFM Public API** — a FastAPI service (`api/index.py`, deployed on Vercel next to the existing site) that exposes Dear Future Me as an API: personal API keys (`dfm_live_…`, SHA-256-hashed, shown once), per-user scoping enforced in the service layer over Supabase service-role, endpoints derived from `FUTURE_PLAN.md` §8's tool library. External AI tools consume it three ways: **ChatGPT** (custom GPT Action importing our live `openapi.json`), **Gemini** (function-declaration JSON + optional Gemini CLI extension via MCP), **any voice agent** (plain REST with `x-api-key`).
2. **Voice-first iPhone app** — pure SwiftUI + WidgetKit. Home/Lock-Screen widget → deep link → immediately-listening voice session → on-device STT (`SFSpeechRecognizer`) → Claude Messages API tool-calling loop → DFM API → `AVSpeechSynthesizer` TTS. App Intents give Siri/Action-Button entry.

**Demo target** (FUTURE_PLAN.md §27, lines 698–722): five moments — Capture a proud moment by voice → "I want future me to remember how this feels" creates a Future Letter → "Have I ever felt like this before?" searches memories → "Play it" reads a past entry aloud → agent contrasts past vs. present. Plus one extra beat the spec doesn't have: **the same entry appearing in the web notebook**, proving API-first worked (§22 mandate).

---

## Phase 0 — Consolidated Discovery (done; this section is the evidence base)

### 0.1 Repo ground truth

- Backend today = **one file**: `api/cron/seed-accomplishments.js` (Vercel Node fn, unauthenticated, daily cron per `vercel.json`). No API-key infra, no service layer, no Python, no mobile code anywhere.
- Frontend: Vite/React 18, all data access is inline `supabase.from(...)` calls in components (`src/pages/MyNotebookPage.tsx:186–254`, `ExplorePage.tsx:213`, etc.). Auth = Supabase email/password + Google OAuth (`src/context/AuthContext.tsx`).
- Content model today: `journals(journal_id, user_id, entry_date, title, content, is_public, created_at, updated_at)` + **drifted** `type` column (`'letter'|'note'|'accomplishment'`) that exists in the live DB but **in no migration**. Same drift: `testimonials.tags`, `profiles.phone`, `profiles.notifications_enabled`, RPC `count_community_letters()`. `supabase db reset` breaks the app today — Phase 1 fixes this before we build on it.
- **No scheduled delivery exists.** No `deliver_at` column anywhere; `supabase/functions/send-email` (Resend, unauthenticated) is never invoked. A future-letter delivery pipeline is greenfield.
- Open RLS holes to close while we're in the schema: `accomplishments` DELETE `USING (true)`, `thanksgiving_gratitude` DELETE `USING (true)`, `letter_counts` UPDATE `USING (true)`.
- Existing env: `.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; `supabase/.env` → `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### 0.2 The spec we're implementing (FUTURE_PLAN.md, exact line refs)

- **§8 tool library** (lines 190–269): 22 functions — `createReflection, updateReflection, createProudMoment, createMemory, createFutureLetter, createVoiceTimeCapsule, getFutureLetters, readFutureLetter, searchMemories, getReflectionHistory, getProudMoments, getRecentMemories, getTimeline, getPersonalThemes, comparePastAndPresent, createGoal, updateGoal, getGoals, createReminderToFutureSelf, getUserValues, saveConversationAsReflection` (+ §33 `getCrisisResources(region)`, §35 `getTrustedContacts`, §41 `correctMemory/deleteMemory/excludeFromAIContext`). Only `createFutureLetter` has explicit params (lines 210–215): content, delivery/revisit date, context, tags, audio attachment.
- **Canonical entity fields** = §15 Memory Detail View (lines 478–487): title, date, original content, voice recording, transcript, AI summary, tags/themes, related memories, future revisit date. Voice time capsule (line 309): audio, transcript, date, context, optional title, optional future-open date.
- **§22** (582–594): no isolated mobile DB; same account system; same reflection on web + app; architect around an API/service layer; no mock-data hard-coding.
- **§24** (632): pipeline `Speech input → transcript → agent → tool selection → DFM service → result → conversational response → speech output`; no tool-selection logic in UI components.
- **§26 MVP P1** (653–664): auth, voice UI, create reflection/proud moment/memory/future letter, transcript, tool calling, persist, retrieve, semantic search. P3 = widgets/intents (we pull the *small launcher widget* forward because the user wants widget-as-main-entry).
- **§44 permissions** (1002–1018), enforced **in application code**: safe-autonomous = create reflection / retrieve / draft future letter / search; confirmation-required = permanent delete, share, contact person, export, account settings; restricted = emergency comms, crisis-content sharing, medical actions.
- **§17/§40 memory provenance**: `USER_MEMORY` / `AI_SUMMARY` / `AI_INFERENCE` tags; never rewrite AI inferences into the user's record.
- **Safety minimum for tonight**: `getCrisisResources(region)` endpoint with data outside the LLM prompt (§33 line 860); do not auto-convert crisis conversations into memories (§42). Full classifier/state machine (§30/§45) is explicitly out of tonight's scope — logged in Risk register.

### 0.3 Verified platform facts ("Allowed APIs")

**Vercel + FastAPI** (vercel.com/docs/frameworks/backend/fastapi, …/functions/runtimes/python, both updated 2026-07-22):
- Native FastAPI support: an `app = FastAPI()` in `api/index.py` is auto-detected; **no rewrites hack needed**; whole app becomes one Fluid-compute function. `requirements.txt` at repo root. Python 3.12 (default)–3.14.
- Mixed runtimes in `api/` are supported — the existing Node cron file coexists. Unresolved edge (15-min spike in Phase 3): route-precedence between the Node file's implicit `/api/cron/seed-accomplishments` route and the FastAPI catch-all; mitigation = keep all FastAPI routes under `/v1/*` and add explicit `rewrites` only if the spike shows a collision.
- Limits that matter: 4.5 MB request/response body (→ audio uploads go direct to Supabase Storage, never through the API), maxDuration via `{"functions": {"api/index.py": {"maxDuration": 60}}}`.

**FastAPI auth** (fastapi.tiangolo.com/reference/security/): `fastapi.security.APIKeyHeader(*, name, scheme_name=None, description=None, auto_error=True)` → `Depends` yields the header string; `auto_error=False` for dual-scheme (key OR Supabase JWT) endpoints; surfaces in `openapi.json` as `{"type":"apiKey","in":"header","name":"x-api-key"}` — exactly what GPT Actions expects.

**supabase-py** (supabase.com/docs/reference/python): package `supabase` **2.31.0**; `create_client(url, key)`; service-role key server-side bypasses RLS (making our service layer the enforcement point); `supabase.auth.get_user(jwt)` validates a user JWT server-side; `.table("journals").select("*").eq("user_id", uid).execute()`.

**ChatGPT** (developers.openai.com/api/docs/actions/*): custom GPT Action imports OpenAPI **3.1** by URL; spec **must include `servers:`** (FastAPI doesn't emit it by default → `FastAPI(servers=[{"url": ...}])`); auth = API Key with **Custom header name** (`x-api-key`); key is builder-level. MCP connectors in ChatGPT exist but are OAuth-oriented → GPT Action is tonight's path.

**Gemini** (ai.google.dev/gemini-api/docs/function-calling): **no OpenAPI import**. Provide function declarations (OpenAPI-schema subset: `type, nullable, required, format, description, properties, items, enum, anyOf, $ref, $defs`) via `google-genai` SDK; caller executes the HTTP call. Consumer Gemini apps are partnership-only; the open surface is **Gemini CLI extensions** (`gemini-extension.json` shipping an MCP server).

**MCP Python SDK** (github.com/modelcontextprotocol/python-sdk): package `mcp` **v2.0.0** (2026-07-28) — **`FastMCP` is renamed `MCPServer`** (`from mcp.server import MCPServer`); old fastmcp tutorials are stale. Mount: `app.mount("/mcp", mcp.streamable_http_app())` **and the host lifespan must enter `mcp.session_manager.run()`** or first request raises `RuntimeError`. Streamable-HTTP sessions are stateful → serverless risk; MCP is a stretch phase, not the demo path.

**iOS** (Apple docs, verified):
- **Pure SwiftUI + WidgetKit**, not Expo (`@bacons/apple-targets` is officially "experimental", widget still must be Swift, prebuild loop, App Groups need paid account).
- Widget: `Widget` + `StaticConfiguration(kind:provider:content:)` + `TimelineProvider` returning `Timeline(entries:[Entry(date:.now)], policy:.never)`; `.widgetURL(URL("dearfutureme://talk"))` → app `.onOpenURL`; Lock Screen via `.supportedFamilies([.systemSmall, .accessoryCircular, .accessoryRectangular])`. Copy-ready example: developer.apple.com/documentation/widgetkit/creating-a-widget-extension.
- App Intents: `AppIntent` with `static var openAppWhenRun = true` + `AppShortcutsProvider` (`AppShortcut(intent:phrases:...)`, every phrase must contain `\(.applicationName)`). Action Button = user binds our App Shortcut; no extra API.
- STT: `SFSpeechRecognizer` (iOS 10+, not deprecated, most copy-paste material): `SFSpeechAudioBufferRecognitionRequest` + `shouldReportPartialResults = true` + `audioEngine.inputNode.installTap` → `recognitionTask`. Info.plist: `NSMicrophoneUsageDescription` + `NSSpeechRecognitionUsageDescription`. (iOS 26 `SpeechAnalyzer`/`SpeechTranscriber` exists — only if the test device runs iOS 26+ and time allows.)
- TTS: `AVSpeechSynthesizer().speak(AVSpeechUtterance(string:))`; `AVAudioSession` category `.playAndRecord` + `.defaultToSpeaker`. Personal Voice (`requestPersonalVoiceAuthorization`) is a thematic stretch goal.
- Claude from Swift: **no official Swift SDK for the Messages API** (ClaudeForFoundationModels needs iOS 27 betas) → plain URLSession: `POST https://api.anthropic.com/v1/messages`, headers `x-api-key`, `anthropic-version: 2023-06-01`; `tools:[{name, description, input_schema}]`; loop on `stop_reason == "tool_use"` → execute → append `{"type":"tool_result","tool_use_id":…,"content":…}` → repeat to `end_turn`. Docs: platform.claude.com/docs/en/agents-and-tools/tool-use/overview.
- Signing: free Apple ID Personal Team works for app + widget extension (no App Groups needed for a launcher widget); 7-day provisioning, 3 devices; iPhone needs Developer Mode on. **Xcode.app is NOT installed on this Mac** (only CommandLineTools) — download is the critical path.

### 0.4 Anti-patterns (hard guards, repeated in phases)

1. `FastMCP` import or fastmcp-tutorial code — v2 renamed it `MCPServer`.
2. FastAPI-on-Vercel rewrites boilerplate from pre-2026 tutorials — entrypoint auto-detection replaced it.
3. Forgetting `servers:` in OpenAPI — GPT Action import will fail or call the wrong host.
4. Pointing Gemini at `openapi.json` — no such mechanism; ship function declarations.
5. Storing raw API keys, or keys queryable after creation — hash-only, show-once.
6. Client-side "RLS": the service-role client bypasses RLS, so **every** query in the service layer must filter by the key's `user_id` — no exceptions, no "admin" shortcuts.
7. Tool permissions only in the system prompt — §44 line 1020 requires code enforcement (delete/export need `confirm=true` + scope).
8. Tool-selection logic inside SwiftUI views — §24 line 634; keep the agent loop in its own type.
9. Audio bytes through the API — 4.5 MB Vercel body cap; use Supabase Storage signed uploads.
10. Widget `Button(intent:)` for launching the session — intent buttons run *without* opening the app; a launcher uses `widgetURL`.
11. Writing AI summaries into `content` — provenance must stay separated (§40).
12. Inventing undocumented params (e.g., `APIKeyHeader(scopes=…)`, `create_client(options={"schema"})` dict form) — stick to the signatures in §0.3.

---

## Architecture decisions (made now, so nobody re-litigates at 1 a.m.)

| # | Decision | Rationale |
|---|---|---|
| D1 | FastAPI lives at `api/index.py`, all routes under `/v1/*`; same Vercel project as the site | Native support, one deploy, avoids Node-fn route collision by prefix discipline |
| D2 | **Extend `journals`** (new columns + new `type` values) rather than a new content table | §22 "same reflection appears on website and app" for free — web notebook already reads `journals`; codifying the drifted `type` column happens anyway |
| D3 | API keys are **personal** (map to one `user_id`), created from a signed-in web page; scopes `read`/`write`/`delete` | Matches "my ChatGPT talks to my DFM"; JWT-gated issuance reuses existing auth |
| D4 | Key format `dfm_live_` + 43 chars base62 from `secrets.token_urlsafe(32)`; store SHA-256 hex + 8-char display hint; show once | Industry standard (Stripe/GitHub pattern), scanner-detectable prefix |
| D5 | Search tonight = Postgres full-text (`websearch_to_tsquery`) + LLM re-ranking in the agent; pgvector = stretch | No embedding provider integration risk on the critical path; demo query "have I felt like this before" works fine with FTS + the agent's judgment |
| D6 | Voice loop model: `claude-haiku-4-5` default for latency, `claude-sonnet-5` behind a constant if tool selection is sloppy | Voice demo lives or dies on latency |
| D7 | iOS: SwiftUI + Widget Extension, free Personal Team, launcher widget only (no App Groups) | Fewest steps to widget→voice for a team new to native |
| D8 | ChatGPT = GPT Action on live `openapi.json`; Gemini = function-declarations JSON in repo; MCP = stretch | Ordered by verified effort-to-demo |
| D9 | Letter delivery = daily Vercel cron → FastAPI route → Resend | Reuses existing cron + Resend patterns already in the repo |
| D10 | The demo's Claude API key is baked into the iOS build via an untracked `Secrets.xcconfig` | Fine for a demo, never for shipping; noted in review checklist |

---

## Tonight's budget (tracks run in parallel; ~7h wall clock)

**Track A — Backend/API (Phases 1–3), ~3.5h. Track B — iOS (Phases 6–8), ~3.5h after Xcode lands. Track C — Integrations + web UI (Phases 4–5), ~1.5h, after Phase 3 deploys.**

| When | Track A (backend) | Track B (iOS) | Track C |
|---|---|---|---|
| T+0:00 | **USER: start Xcode install now** (App Store; ~40–60 min incl. first-launch components) | — | — |
| T+0:00–0:45 | Phase 1 migrations written + applied | Xcode downloading | — |
| T+0:45–2:30 | Phase 2 FastAPI service + tests | Phase 6 project scaffold, mic/STT/TTS spike on device | — |
| T+2:30–3:30 | Phase 3 deploy + routing spike + cron | Phase 7 agent loop against **deployed** API | — |
| T+3:30–5:00 | support Track B/C | Phase 7 cont.: DFM tools, permissions, session UX | Phase 4 key-management web page |
| T+5:00–6:30 | — | Phase 8 widget + App Intents + design pass | Phase 5 GPT Action + Gemini decls (+ MCP if green) |
| T+6:30–7:00 | **Phase 9 all-hands: end-to-end demo rehearsal (§27 five moments), commit, push** | | |

**User-action checklist (the only things Claude cannot do alone):**
1. Start Xcode install from the App Store **immediately** (critical path for Track B).
2. `supabase` CLI login / or run Phase 1 SQL in the dashboard SQL editor; confirm we're pointed at the right project.
3. Vercel: `npm i -g vercel && vercel login`, link the existing project, add env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `DFM_PUBLIC_URL`).
4. Anthropic API key for the iOS agent loop.
5. iPhone: enable Developer Mode; add Apple ID to Xcode (Personal Team); trust cert after first install.
6. ChatGPT: create the custom GPT (needs your OpenAI account) — paste `https://<prod>/v1/openapi.json` URL + `x-api-key` custom auth.

---

## Phase 1 — Migrations: codify drift, api_keys, entry model (~45 min)

**Implement** — three new files in `supabase/migrations/` (timestamp-prefixed, after `20250903…`):

1. `…_codify_drift.sql` — make the live DB reproducible. Guarded DDL only:
```sql
ALTER TABLE journals     ADD COLUMN IF NOT EXISTS type text DEFAULT 'note';
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE profiles     ADD COLUMN IF NOT EXISTS phone text,
                         ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT false;
CREATE OR REPLACE FUNCTION count_community_letters() RETURNS integer
  LANGUAGE sql STABLE AS $$ SELECT count(*)::int FROM journals WHERE type = 'letter' $$;
-- close the open RLS holes found in audit (accomplishments/thanksgiving DELETE, letter_counts UPDATE)
DROP POLICY IF EXISTS "Allow deletion with key" ON accomplishments;
DROP POLICY IF EXISTS "Allow thanksgiving gratitude deletion with key" ON thanksgiving_gratitude;
DROP POLICY IF EXISTS "Anyone can update letter counts" ON letter_counts;
```
2. `…_api_keys.sql`:
```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'default',
  key_hash text NOT NULL UNIQUE,        -- sha256 hex of full key
  key_hint text NOT NULL,               -- 'dfm_live_ab…' first 12 chars for display
  scopes text[] NOT NULL DEFAULT ARRAY['read','write'],
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys (key_hash);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own keys select" ON api_keys FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own keys insert" ON api_keys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own keys update" ON api_keys FOR UPDATE TO authenticated USING (auth.uid() = user_id);
```
(RLS matters here because the *web page* manages keys via the anon client + JWT; FastAPI uses service role.)
3. `…_voice_entries.sql` — extend `journals` into the §15 entity (D2):
```sql
ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS transcript text,
  ADD COLUMN IF NOT EXISTS audio_path text,          -- Supabase Storage path, never bytes
  ADD COLUMN IF NOT EXISTS revisit_at timestamptz,   -- future-letter delivery / time-capsule open date
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS context text,             -- createFutureLetter 'context' param (§8 line 213)
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'web',        -- web | voice | api
  ADD COLUMN IF NOT EXISTS provenance text DEFAULT 'USER_MEMORY'; -- USER_MEMORY | AI_SUMMARY | AI_INFERENCE (§40)
CREATE INDEX IF NOT EXISTS journals_fts_idx ON journals
  USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')));
CREATE INDEX IF NOT EXISTS journals_revisit_idx ON journals (revisit_at) WHERE revisit_at IS NOT NULL;
```
`type` values in use after tonight: `letter | note | accomplishment | reflection | memory | proud_moment | time_capsule`. Web notebook filters by its three known types, so new kinds simply don't render there yet (except `letter`, which appears — that's the demo beat). Also create a **private Storage bucket `voice-audio`** (dashboard or `insert into storage.buckets`), path convention `{user_id}/{journal_id}.m4a`.

**Docs**: existing migration style: `supabase/migrations/20250609040904_sweet_recipe.sql` (copy its policy syntax). Drift list: FEATURES.md §5.4.
**Verify**: `supabase db push` (or SQL editor) succeeds; re-running is idempotent (all DDL guarded); web app still loads notebook + stories (drift columns unchanged, only formalized); `select count_community_letters();` returns a number.
**Anti-patterns**: no unguarded `CREATE TABLE` for existing tables (the `accomplishments` double-create in `copper_grass.sql` is the cautionary tale in this very repo); do not touch `journals` RLS (existing policies already scope by `auth.uid()`); do not add a `sessions` FK (that phantom table burned `accomplishments` once already).

---

## Phase 2 — FastAPI service (~1h45)

**Implement** — new files:
```
api/index.py              # FastAPI app, routes only
api/_lib/deps.py          # auth dependencies (api key, jwt), supabase client
api/_lib/service.py       # ALL data access; every fn takes user_id first
api/_lib/schemas.py       # Pydantic models
api/_lib/crisis.py        # static region→resources data (§33: outside any prompt)
requirements.txt          # repo root: fastapi, supabase==2.31.*, pydantic
```
(Leading-underscore dir so Vercel doesn't treat helpers as functions; entrypoint stays `api/index.py` per §0.3.)

Key patterns (copy, don't improvise):
```python
# deps.py
import hashlib
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader
from supabase import create_client

api_key_header = APIKeyHeader(name="x-api-key", scheme_name="ApiKeyAuth", auto_error=False)

def get_supabase():  # service-role: RLS bypassed — service layer IS the enforcement point
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

async def require_key(key: str | None = Depends(api_key_header)) -> AuthedUser:
    if not key: raise HTTPException(401, "Missing x-api-key")
    h = hashlib.sha256(key.encode()).hexdigest()
    row = sb.table("api_keys").select("*").eq("key_hash", h).is_("revoked_at", "null").execute().data
    if not row: raise HTTPException(401, "Invalid API key")
    # update last_used_at (fire-and-forget); return user_id + scopes
```
```python
# index.py
app = FastAPI(
    title="Dear Future Me API", version="0.1.0",
    servers=[{"url": os.environ.get("DFM_PUBLIC_URL", "http://localhost:8000")}],  # REQUIRED for GPT Actions
    root_path="",
)
```

**Endpoints** (all under `/v1`, all `require_key` unless noted; §8 mapping in parentheses):

| Route | §8 tools covered |
|---|---|
| `POST /v1/entries` `{kind, title?, content, transcript?, tags?, context?, revisit_at?, audio_path?, provenance?}` | createReflection, createMemory, createProudMoment, createVoiceTimeCapsule, saveConversationAsReflection, createReminderToFutureSelf (kind=`note`, tag `reminder`) |
| `PATCH /v1/entries/{id}` | updateReflection, correctMemory |
| `DELETE /v1/entries/{id}?confirm=true` — 400 without confirm, 403 without `delete` scope | deleteMemory (§44 confirmation class) |
| `GET /v1/entries?kind=&from=&to=&limit=` | getReflectionHistory, getProudMoments, getRecentMemories |
| `POST /v1/letters` (kind forced `letter`, `revisit_at` required) | createFutureLetter |
| `GET /v1/letters?status=upcoming|past` / `GET /v1/letters/{id}` | getFutureLetters, readFutureLetter |
| `GET /v1/search?q=&kind=` — FTS via `.text_search()` or RPC `search_entries(q, uid)` | searchMemories |
| `GET /v1/timeline?from=&to=` — entries grouped by day, all kinds | getTimeline, comparePastAndPresent (agent-side over two ranges) |
| `GET /v1/themes` — top tags + counts (honest stat aggregation, no AI) | getPersonalThemes, getUserValues (approximation, documented as such) |
| `POST /v1/audio-upload-url` — Supabase Storage signed upload URL for `voice-audio/{uid}/…` | audio attachment path (anti-pattern #9) |
| `GET /v1/me` | account context |
| `GET /v1/crisis-resources?region=` — **no auth**, served from `crisis.py` data | getCrisisResources |
| `POST /v1/keys`, `GET /v1/keys`, `POST /v1/keys/{id}/revoke` — **Supabase JWT auth** (`Authorization: Bearer` → `sb.auth.get_user(jwt)`), not API key | key management |
| `GET /v1/cron/deliver-letters` — guarded by `CRON_SECRET` header | delivery (Phase 3) |

Goals (`createGoal/updateGoal/getGoals`): §8 line 254 makes them conditional on platform support — **cut tonight**, modeled later as `kind='goal'`. Trusted contacts: cut (restricted-action class, no safe demo value).

**Docs**: APIKeyHeader signature §0.3; supabase-py idioms §0.3; scope/confirm semantics FUTURE_PLAN.md 1002–1020.
**Verify**: `uv run uvicorn api.index:app` locally with `supabase/.env` values; `curl` happy-path for every route; `curl` without key → 401; key of another user cannot read your entries (create two test users); `DELETE` without `confirm=true` → 400; `/openapi.json` contains `servers` + `securitySchemes.ApiKeyAuth`; `python -c "import api.index"` clean.
**Anti-patterns**: #5, #6, #7, #9, #12 from §0.4. Every `service.py` function's first parameter is `user_id` and every query chains `.eq("user_id", user_id)` — grep-check in Phase 9.

---

## Phase 3 — Deploy + routing spike + letter delivery (~1h)

**Implement**:
1. `vercel.json` — add (keep existing cron):
```json
{
  "crons": [
    { "path": "/api/cron/seed-accomplishments", "schedule": "0 0 * * *" },
    { "path": "/v1/cron/deliver-letters", "schedule": "0 14 * * *" }
  ],
  "functions": { "api/index.py": { "maxDuration": 60 } }
}
```
2. **Routing spike (timeboxed 15 min)**: deploy preview, confirm (a) `/` serves the Vite site, (b) `/api/cron/seed-accomplishments` still hits the Node fn, (c) `/v1/me` hits FastAPI. If (a) or (c) fails: add explicit `"rewrites": [{"source": "/v1/(.*)", "destination": "/api/index"}]` — the documented fallback — and re-test.
3. `deliver-letters` route in `index.py`: select `journals` where `type='letter' AND revisit_at <= now() AND delivered_at IS NULL`, send via Resend HTTP API (`RESEND_API_KEY` — same env the edge function uses; from-address pattern copied from `supabase/functions/send-email/index.ts`), set `delivered_at`. Auth: require header `x-cron-secret == os.environ["CRON_SECRET"]` (unlike the existing unauthenticated Node cron — don't copy that part).
4. Set env vars in Vercel (user action #3), including `DFM_PUBLIC_URL=https://<prod-domain>` so `servers:` is right in production.

**Verify**: production `curl https://<prod>/v1/crisis-resources?region=us` → 200 JSON; `/openapi.json` shows the prod server URL; insert a test letter with `revisit_at=now()` → hit cron route with secret → email arrives → `delivered_at` set; second hit is a no-op.
**Anti-patterns**: #2 (no legacy rewrites unless the spike demands them); never expose `deliver-letters` unauthenticated; Resend called via HTTPS API, not the npm package inside Python.

---

## Phase 4 — Web: API-keys page (~45 min)

**Implement**: `src/pages/ApiKeysPage.tsx` at route `/developer` (add to `src/App.tsx` route table; link from navbar user area). Signed-in users: list keys (`key_hint`, name, created, last used, revoke button) and create key → calls `POST /v1/keys` with `Authorization: Bearer ${session.access_token}` (get session from `supabase.auth.getSession()`) → shows the raw key **once** in a copy box with a "you won't see this again" note.
**Docs**: page scaffold pattern: `src/pages/FeedbackPage.tsx` (simplest existing page); auth context: `src/context/AuthContext.tsx`; design: DESIGN_SYSTEM.md §17 non-negotiables (cream `#F9F5ED`, green text `#5D8E67`/`#3a5c42`, `rounded-2xl`, Comfortaa+Caveat, pastel accents by prop). Copy existing `Button.tsx`/`StatCard.tsx` components — don't restyle.
**Verify**: `npm run typecheck && npm run lint`; create → key shown once, appears in list as hint after reload; revoke → key 401s on `/v1/me`; signed-out visit → soft gate like `MyNotebookPage.tsx`.
**Anti-patterns**: never render `key_hash`; never fetch keys with the service client pattern; no white backgrounds / gray text (§17 non-negotiables 1–2).

---## Phase 5 — External AI integrations (~45 min + MCP stretch)

**Implement**:
1. **ChatGPT GPT Action** (user does clicks, we prep everything): write `integrations/chatgpt/README.md` with exact steps — GPT editor → Actions → Import from URL `https://<prod>/v1/openapi.json` → Auth: API Key / Custom / header `x-api-key` → paste a key from `/developer`. Include 6 test prompts matching §27 moments. If import chokes on our spec size, fallback: `curl /openapi.json | jq` → trim to the 8 demo-relevant paths, paste inline.
2. **Gemini**: `integrations/gemini/function_declarations.json` — hand-written declarations for the 8 core endpoints using **only** the supported schema subset (§0.3); plus `integrations/gemini/demo.py` (`google-genai` SDK, dispatch loop calling our API with `httpx`) runnable as the Gemini demo.
3. **MCP (stretch, only if T+5:30 status is green)**: `api/_lib/mcp_server.py` with `from mcp.server import MCPServer`; tools wrap `service.py` functions; key via per-request header middleware; mount per §0.3 lifespan pattern. If Vercel statefulness bites (known risk), demo it locally via `uv run` instead — do not burn deploy time.
4. `integrations/README.md` — one page: what DFM API is, how to get a key, the three integration paths. This is also tomorrow's judge-facing doc.

**Verify**: ChatGPT GPT round-trip: "Save a proud moment that I deployed my first API" → row appears in `journals` with `source='api'`; Gemini `demo.py` creates + searches an entry; MCP (if built) lists tools in `npx @modelcontextprotocol/inspector`.
**Anti-patterns**: #1 (FastMCP), #3 (servers), #4 (Gemini-OpenAPI). Don't publish the GPT publicly (needs privacy policy) — link-share is enough for the demo.

---

## Phase 6 — iOS scaffold + voice pipeline spike (~1h15, starts when Xcode lands)

**Implement**:
1. Xcode → New Project → iOS App, SwiftUI, name `DearFutureMe`, bundle id `com.neurohealth.dearfutureme` (Personal Team). Files: `DearFutureMeApp.swift`, `VoiceSessionView.swift`, `SpeechRecognizer.swift`, `Speaker.swift`, `Theme.swift`.
2. Info tab: `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`, URL Type scheme `dearfutureme`.
3. `SpeechRecognizer.swift`: the canonical `SFSpeechRecognizer` live pattern (§0.3) — request auth, `AVAudioEngine` tap 1024 frames → `SFSpeechAudioBufferRecognitionRequest` (`shouldReportPartialResults = true`, on-device if supported) → publish partial transcript via `@Observable`. End-of-utterance = 1.2 s silence timer on partial updates (simple, good enough tonight).
4. `Speaker.swift`: `AVSpeechSynthesizer` wrapper; `AVAudioSession` `.playAndRecord` + `.defaultToSpeaker`; `stopSpeaking(at: .immediate)` when mic detects user speech (§25 interruption requirement, line 645).
5. `VoiceSessionView`: full-screen cream, breathing voice orb (Theme: cream `#F9F5ED`, greens `#5D8E67`/`#3a5c42`, SF Rounded as Comfortaa stand-in), live transcript line, tap-orb to talk. `.onOpenURL` → `dearfutureme://talk` starts listening immediately (§2A: "Do not force users through menus before speaking").
6. Run on the real iPhone early (signing/Developer Mode friction is front-loaded here on purpose).

**Docs**: Apple sample "Recognizing speech in live audio"; permission keys §0.3; DESIGN_SYSTEM.md §17 for palette.
**Verify** (on device, not simulator — mic): speak → live partial transcript renders; TTS speaks a canned reply through the speaker; speaking while TTS plays interrupts it; widget-less deep link test: Safari → `dearfutureme://talk` opens listening.
**Anti-patterns**: mic code on simulator-only testing; forgetting audio-session category (silent TTS after record is THE classic bug); blocking the main thread in the tap callback.

---

## Phase 7 — Agent loop + DFM tools (~1h30)

**Implement**:
1. `AgentLoop.swift` — actor owning conversation state, per §24 pipeline, zero UI imports. URLSession → Claude Messages API (wire shape in §0.3), model `claude-haiku-4-5` (D6), `max_tokens 1024`.
2. `DFMTools.swift` — tool schemas + executors calling the **deployed** API with `x-api-key` from settings: `save_entry` (kind enum), `create_future_letter`, `search_memories`, `get_entries`, `get_timeline`, `read_letter`. Executor returns compact JSON strings as `tool_result`.
3. System prompt (in code, versioned): DFM companion persona; §44 rules restated *and* enforced in `DFMTools` (no delete tool exposed at all tonight — cleanest §44 compliance); "one intelligent follow-up question" behavior for the §27 demo; instruction to answer in ≤2 spoken-length sentences.
4. Session flow: transcript finalized → append user msg → loop until `end_turn` → speak text → auto-listen again (conversation continues until user taps orb off).
5. Settings sheet: DFM API key + Claude key fields (backed by Keychain via `KeychainSwift`? No — plain `UserDefaults` tonight, flagged in review) + first-run paste flow.

**Docs**: tool-use loop docs (§0.3 Anthropic links); the 5 demo utterances (§27) are the acceptance tests.
**Verify** (device, prod API): each §27 moment works end-to-end; the web notebook at `/notebook` shows the letter created by voice (§22 proof-beat); airplane-mode → graceful spoken error, app doesn't crash; tool errors surface as spoken "I couldn't save that" not silence.
**Anti-patterns**: #8 (loop in views), #7 (no code-level permission gate), retry storms on 401 (bad key → tell the user once).

---

## Phase 8 — Widget, App Intents, polish (~1h)

**Implement**:
1. File → New → Target → Widget Extension `DFMWidget` (uncheck config-intent), Personal Team, bundle id `….dearfutureme.widget`.
2. Static launcher widget: `Timeline(entries:[Entry(date:.now)], policy:.never)`; small = voice orb + "Talk to Future You" (rotate 3 §2B prompts by day-of-week — no network in the widget tonight); families `[.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular]`; `.widgetURL(URL(string:"dearfutureme://talk"))`. Medium adds today's prompt text.
3. `TalkIntent: AppIntent` (`openAppWhenRun = true`, sets a shared "start listening" flag read by the app on activation) + `AppShortcutsProvider` phrases: "Talk to \(.applicationName)", "Tell \(.applicationName) something", "Record a memory in \(.applicationName)". Action Button setup = documented user step (Settings → Action Button → Shortcut).
4. Design pass on app + widget against §17 non-negotiables (cream, greens, rounded, opacity hierarchy).

**Docs**: WidgetKit example page (§0.3); AppShortcut phrase rule (must contain `\(.applicationName)`).
**Verify**: widget on Home Screen + Lock Screen; tap → app opens **already listening** (the whole pitch); "Hey Siri, talk to Dear Future Me" opens listening (mark flaky-OK per forums — widget is the dependable path); widget renders in both light/dark.
**Anti-patterns**: #10 (`Button(intent:)` for launch); App Groups (free account, and a launcher doesn't need them); network calls in `TimelineProvider`.

---

## Phase 9 — Verification & demo rehearsal (~30 min, all-hands)

1. **Grep gates**: `grep -rn "FastMCP" api/` → empty; `grep -rn "service_role\|SERVICE_ROLE" src/` → empty (no service key near the client); every `service.py` query mentions `user_id` (`grep -n "def " api/_lib/service.py` and eyeball signatures); `grep -rn "sk-ant\|dfm_live_" --include="*.swift" -r .` → only the xcconfig reference, no literals committed.
2. **Cross-user isolation test**: user A's key reading user B's entry id → 404 (scripted curl pair, keep in `integrations/tests.sh`).
3. **OpenAPI contract**: `curl /openapi.json | python -c 'import json,sys; s=json.load(sys.stdin); assert s["servers"] and "ApiKeyAuth" in s["components"]["securitySchemes"]'`.
4. **Full §27 rehearsal on device, twice**, stopwatch ≤3 min, with the web-notebook reveal as the closer. Record the second run (screen + phone) as the backup demo video.
5. `npm run typecheck && npm run lint` clean; commit everything on `voice-os-hackathon`; push.
6. Write `HANDOFF.md`: what was cut (goals, trusted contacts, safety classifier, pgvector, MCP-if-skipped), where each cut is stubbed, and tomorrow's review checklist.

---

## Risk register & fallbacks

| Risk | Likelihood | Fallback |
|---|---|---|
| Xcode install slow / fails | Med | Track A+C are a complete demo alone (ChatGPT + Gemini + web). iOS shifts to tomorrow morning; plan survives |
| Vercel Python routing collides with static site | Low-Med | Documented rewrites fallback (Phase 3.2); worst case `uv run uvicorn` + Cloudflare quick tunnel for the demo URL |
| Free-account widget signing quirk (forum-verified only) | Low | App-only demo: App Intent + Action Button as entry; widget shown in simulator |
| GPT Action import rejects spec | Low | Trim spec to 8 paths, paste inline (Phase 5.1) |
| SFSpeechRecognizer accuracy in a noisy room | Med | Demo with AirPods; rehearse exact §27 phrasings |
| MCP on serverless statefulness | High (known) | MCP is stretch; local inspector demo only |
| Latency makes voice feel dead | Med | haiku-4-5 (D6), short system-prompt, spoken filler ("hmm, let me look…") while tools run |
| Safety scope (§29–55 not built) | Certain | `crisis-resources` endpoint + no-delete-tool + no-crisis-memory note in HANDOFF.md; full classifier is post-hackathon work — say so honestly if asked |

## Tomorrow (review day)

Morning: run Phase 9 gates again cold; `/code-review` on the branch (backend + web); manual review of Swift (no CI for it); fix list. Afternoon: demo polish — widget placement, rehearsals, backup video check, `integrations/README.md` as the judge handout. Explicit review items: UserDefaults→Keychain for keys, baked Claude key (D10), delivered-letters cron idempotency under concurrency, RLS-hole closures didn't break workshop pages.
