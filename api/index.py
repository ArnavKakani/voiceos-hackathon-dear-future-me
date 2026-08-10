import html
import os
from datetime import datetime, timezone
from typing import Annotated, Literal

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from supabase import Client

from ._lib import a1, direct_backend, service, voiceos_agent
from ._lib.crisis import resources_for
from ._lib.deps import AuthedUser, get_supabase, require_jwt, require_key
from ._lib.schemas import (
    APIKeyCreate,
    AudioUploadRequest,
    EntryCreate,
    EntryKind,
    EntryUpdate,
    FutureLetterCreate,
    MobileSignupCreate,
)


PUBLIC_URL = os.environ.get("DFM_PUBLIC_URL", "http://localhost:8000").rstrip("/")

app = FastAPI(
    title="Dear Future Me API",
    description="Save, retrieve, and revisit private Dear Future Me memories.",
    version="0.1.0",
    servers=[{"url": PUBLIC_URL}],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[PUBLIC_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "x-api-key", "x-cron-secret"],
)


def not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Entry not found")


_LOCAL_GATEWAY_ONLY = voiceos_agent.AGENT_ENABLED and not os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY"
)


def get_onboarding_supabase() -> Client | None:
    """Skip service-role setup when signup connects to the shared demo."""
    if direct_backend.ENABLED:
        return None
    return get_supabase()


@app.middleware("http")
async def direct_supabase(request, call_next):
    """Vercel-free mode: serve /v1 data routes straight from Supabase with the
    demo account, so the whole stack runs on this Mac with no deployed API."""
    path = request.url.path
    if (
        direct_backend.ENABLED
        and path.startswith("/v1/")
        and not path.startswith("/v1/agent/")
        and not path.startswith("/v1/tts")
        and not path.startswith("/v1/stt")
        and not path.startswith("/v1/phone/")
        and not path.startswith("/v1/sms")
        and not path.startswith("/v1/crisis-resources")
        and not path.startswith("/v1/openapi")
        and not path.startswith("/v1/onboarding/")
    ):
        if not direct_backend.authorize(request.headers.get("x-api-key")):
            return JSONResponse(status_code=401, content={"detail": "Invalid API key"})
        body: dict = {}
        raw = await request.body()
        if raw:
            try:
                body = __import__("json").loads(raw)
            except ValueError:
                body = {}
        try:
            status, payload = await direct_backend.handle(
                request.method, path, dict(request.query_params), body
            )
        except direct_backend.DirectError as err:
            return JSONResponse(status_code=err.status, content={"detail": err.detail})
        except httpx.HTTPError:
            return JSONResponse(status_code=502, content={"detail": "Supabase unreachable."})
        return JSONResponse(status_code=status, content=payload)
    return await call_next(request)


@app.middleware("http")
async def local_passthrough(request, call_next):
    """Mac-as-backend mode without Supabase credentials: serve the agent
    gateway locally and transparently forward every other /v1 data call to
    the deployed API, auth headers and all. The phone then needs only one
    base URL for everything."""
    path = request.url.path
    if (
        _LOCAL_GATEWAY_ONLY
        and not direct_backend.ENABLED
        and path.startswith("/v1/")
        and not path.startswith("/v1/agent/turn")
        and not path.startswith("/v1/crisis-resources")
        and not path.startswith("/v1/openapi")
    ):
        upstream_url = f"{voiceos_agent.UPSTREAM}{path}"
        headers = {
            k: v
            for k, v in request.headers.items()
            if k.lower() in ("x-api-key", "authorization", "content-type")
        }
        body = await request.body()
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                upstream = await client.request(
                    request.method,
                    upstream_url,
                    params=dict(request.query_params),
                    headers=headers,
                    content=body or None,
                )
        except httpx.HTTPError:
            return JSONResponse(
                status_code=502,
                content={"detail": "Could not reach the Dear Future Me backend."},
            )
        return JSONResponse(
            status_code=upstream.status_code,
            content=upstream.json() if upstream.content else None,
        )
    return await call_next(request)


@app.post("/v1/tts", tags=["voice"])
async def text_to_speech(
    request: dict,
    x_api_key: Annotated[str | None, Header()] = None,
):
    """ElevenLabs text-to-speech, key held server-side. Returns audio/mpeg.

    Keeps the ElevenLabs key on the Mac so the phone stays thin. Returns 503
    when no key is configured; the app then remains
    text-only and never falls back to a device voice.
    """
    # Auth: accept the demo key in direct mode, else a valid personal key.
    if direct_backend.ENABLED:
        if not direct_backend.authorize(x_api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")
    elif not x_api_key:
        raise HTTPException(status_code=401, detail="Missing x-api-key")

    eleven_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not eleven_key:
        raise HTTPException(status_code=503, detail="Cloud voice not configured.")

    text = str(request.get("text", "")).strip()
    if not text:
        raise HTTPException(status_code=400, detail="Nothing to speak.")
    voice_id = request.get("voice_id") or os.environ.get(
        "ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb"  # a warm default
    )
    model = os.environ.get("ELEVENLABS_MODEL", "eleven_turbo_v2_5")  # low latency

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={"xi-api-key": eleven_key, "content-type": "application/json"},
                json={
                    "text": text[:2000],
                    "model_id": model,
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
            )
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Cloud voice unreachable.")

    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Cloud voice failed.")
    return Response(content=resp.content, media_type="audio/mpeg")


@app.post("/v1/stt", tags=["voice"])
async def speech_to_text(
    request: Request,
    x_api_key: Annotated[str | None, Header()] = None,
):
    """Transcribe a recorded utterance with ElevenLabs Scribe.

    Apple speech recognition is unreliable in Simulator. The app sends a
    short CAF recording here instead; the ElevenLabs key stays server-side.
    """
    if direct_backend.ENABLED:
        if not direct_backend.authorize(x_api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")
    elif not x_api_key:
        raise HTTPException(status_code=401, detail="Missing x-api-key")

    eleven_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not eleven_key:
        raise HTTPException(status_code=503, detail="Speech recognition not configured.")

    audio = await request.body()
    if len(audio) < 256:
        raise HTTPException(status_code=400, detail="No usable audio was received.")
    if len(audio) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="The utterance is too long.")

    media_type = request.headers.get("content-type", "audio/x-caf").split(";", 1)[0]
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.elevenlabs.io/v1/speech-to-text",
                headers={"xi-api-key": eleven_key},
                data={
                    "model_id": os.environ.get("ELEVENLABS_STT_MODEL", "scribe_v2"),
                    "language_code": "en",
                    "tag_audio_events": "false",
                    "timestamps_granularity": "none",
                },
                files={"file": ("utterance.caf", audio, media_type)},
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502, detail="Speech recognition is unreachable."
        ) from error

    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail="Speech recognition failed.")
    try:
        text = str(resp.json().get("text", "")).strip()
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=502, detail="Speech recognition returned an invalid response."
        ) from error
    return {"text": text}


def _require_demo_key(x_api_key: str | None):
    if direct_backend.ENABLED:
        if not direct_backend.authorize(x_api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")
    elif not x_api_key:
        raise HTTPException(status_code=401, detail="Missing x-api-key")


@app.post("/v1/phone/verify", tags=["sms"])
async def phone_verify(
    request: dict, x_api_key: Annotated[str | None, Header()] = None
):
    """Send an OTP so we're allowed to text this number (A1 consent flow)."""
    _require_demo_key(x_api_key)
    if not a1.ENABLED:
        raise HTTPException(status_code=503, detail="Texting is not configured.")
    phone = str(request.get("phone", "")).strip()
    if not phone:
        raise HTTPException(status_code=400, detail="A phone number is required.")
    status, body = await a1.request_verification(phone)
    return JSONResponse(status_code=200 if status < 400 else 502, content=body)


@app.post("/v1/phone/confirm", tags=["sms"])
async def phone_confirm(
    request: dict, x_api_key: Annotated[str | None, Header()] = None
):
    """Confirm the OTP the user received; unlocks texting to that number."""
    _require_demo_key(x_api_key)
    if not a1.ENABLED:
        raise HTTPException(status_code=503, detail="Texting is not configured.")
    phone = str(request.get("phone", "")).strip()
    code = str(request.get("code", "")).strip()
    status, body = await a1.confirm_verification(phone, code)
    return JSONResponse(status_code=200 if status < 400 else 502, content=body)


@app.post("/v1/sms/send", tags=["sms"])
async def sms_send(
    request: dict, x_api_key: Annotated[str | None, Header()] = None
):
    """Text a verified number. Used to deliver a letter 'from future you'."""
    _require_demo_key(x_api_key)
    if not a1.ENABLED:
        raise HTTPException(status_code=503, detail="Texting is not configured.")
    to = str(request.get("to", "")).strip()
    body_text = str(request.get("body", "")).strip()
    if not to or not body_text:
        raise HTTPException(status_code=400, detail="Both 'to' and 'body' are required.")
    status, body = await a1.send_sms(to, body_text)
    return JSONResponse(status_code=200 if status < 400 else 502, content=body)


# --- Demo hosting: serve the built website from this gateway --------------
# With DFM_SERVE_SITE=1 and a vite build in dist/, dfm.ark404.xyz hosts the
# whole site next to the API (same origin). Client-side routes fall back to
# index.html; real files (assets, fonts) are served directly. /v1, /docs and
# /openapi keep priority because they are matched before the catch-all.
from pathlib import Path as _Path

from fastapi.responses import FileResponse

_DIST = _Path(__file__).resolve().parent.parent / "dist"
# Default ON whenever a site build exists (set DFM_SERVE_SITE=0 to opt out) —
# multiple sessions restart this server with different envs, and the demo
# depends on the site being served no matter who restarted it last.
_SERVE_SITE = os.environ.get("DFM_SERVE_SITE", "1") != "0" and _DIST.exists()


@app.get("/site-health", include_in_schema=False)
async def site_health():
    return {"serving_site": _SERVE_SITE, "dist": str(_DIST)}


@app.get("/", include_in_schema=False)
async def root():
    if _SERVE_SITE:
        return FileResponse(_DIST / "index.html")
    return await _root_json()


async def _root_json():
    """Friendly landing for the bare domain - the API itself lives under /v1."""
    return {
        "service": "Dear Future Me API",
        "status": "ok",
        "docs": f"{PUBLIC_URL}/docs",
        "openapi": f"{PUBLIC_URL}/v1/openapi.json",
        "hint": "Mint a personal key on the website at /developer, then call /v1/* with x-api-key.",
    }


@app.get("/v1/openapi.json", include_in_schema=False)
async def versioned_openapi():
    return JSONResponse(app.openapi())


@app.get("/v1/crisis-resources", tags=["safety"])
async def crisis_resources(region: str = Query(default="us", min_length=2, max_length=80)):
    """Return static crisis resources without sending crisis content to an AI model."""
    return resources_for(region)


@app.post("/v1/onboarding/signup", status_code=201, tags=["account"])
async def mobile_signup(
    request: MobileSignupCreate,
    sb: Client | None = Depends(get_onboarding_supabase),
):
    """Create a DFM account from the voice app and issue its first agent key."""
    if direct_backend.ENABLED:
        try:
            return direct_backend.onboarding_signup(request.name, request.email)
        except direct_backend.DirectError as error:
            raise HTTPException(status_code=error.status, detail=error.detail) from error
    if sb is None:
        raise HTTPException(status_code=503, detail="Supabase is not configured")
    try:
        return service.create_mobile_account(sb, request)
    except Exception as error:
        message = str(error).lower()
        if "already" in message or "registered" in message or "exists" in message:
            raise HTTPException(
                status_code=409,
                detail="An account with that email already exists. Sign in on the website to connect it.",
            ) from error
        raise HTTPException(
            status_code=502,
            detail="We couldn't create that account just now. Please try again.",
        ) from error


@app.post("/v1/agent/turn", tags=["agent"])
async def voice_agent_turn(
    request: voiceos_agent.TurnRequest,
    x_api_key: Annotated[str | None, Header()] = None,
):
    """One response-only conversation turn through local VoiceOS."""
    if not voiceos_agent.AGENT_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="VoiceOS is not enabled on this server.",
        )
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing x-api-key")

    if direct_backend.ENABLED:
        if not direct_backend.authorize(x_api_key):
            raise HTTPException(status_code=401, detail="Invalid API key")
    else:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if not await voiceos_agent.validate_key(client, x_api_key):
                raise HTTPException(status_code=401, detail="Invalid API key")

    try:
        return await voiceos_agent.run_turn(request, x_api_key)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/v1/entries", status_code=201, tags=["entries"])
async def create_entry(
    entry: EntryCreate,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Create a reflection, memory, proud moment, note, or voice time capsule."""
    auth.require("write")
    return service.create_entry(auth.user_id, sb, entry)


@app.get("/v1/entries", tags=["entries"])
async def get_entries(
    kind: EntryKind | None = None,
    from_date: Annotated[datetime | None, Query(alias="from")] = None,
    to_date: Annotated[datetime | None, Query(alias="to")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """List the authenticated user's entries, newest first."""
    auth.require("read")
    return service.list_entries(
        auth.user_id,
        sb,
        kind=kind,
        from_date=from_date,
        to_date=to_date,
        limit=limit,
    )


@app.patch("/v1/entries/{entry_id}", tags=["entries"])
async def patch_entry(
    entry_id: str,
    update: EntryUpdate,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Correct or update one entry owned by the authenticated user."""
    auth.require("write")
    row = service.update_entry(auth.user_id, sb, entry_id, update)
    if row is None:
        raise not_found()
    return row


@app.delete("/v1/entries/{entry_id}", tags=["entries"])
async def remove_entry(
    entry_id: str,
    confirm: bool = False,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Permanently delete an entry; requires explicit confirmation and delete scope."""
    if not confirm:
        raise HTTPException(status_code=400, detail="Set confirm=true to permanently delete")
    auth.require("delete")
    if not service.delete_entry(auth.user_id, sb, entry_id):
        raise not_found()
    return {"deleted": True, "id": entry_id}


@app.post("/v1/letters", status_code=201, tags=["letters"])
async def create_letter(
    letter: FutureLetterCreate,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Create a future letter with a required revisit date."""
    auth.require("write")
    entry = EntryCreate(kind="letter", provenance="USER_MEMORY", **letter.model_dump())
    return service.create_entry(auth.user_id, sb, entry)


@app.get("/v1/letters", tags=["letters"])
async def get_letters(
    status: Literal["upcoming", "past"] = "upcoming",
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """List upcoming or past future letters."""
    auth.require("read")
    return service.list_letters(auth.user_id, sb, status=status, limit=limit)


@app.get("/v1/letters/{entry_id}", tags=["letters"])
async def read_letter(
    entry_id: str,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Read one future letter owned by the authenticated user."""
    auth.require("read")
    row = service.get_entry(auth.user_id, sb, entry_id)
    if row is None or row.get("type") != "letter":
        raise not_found()
    return row


@app.get("/v1/search", tags=["discovery"])
async def search(
    q: Annotated[str, Query(min_length=1, max_length=500)],
    kind: EntryKind | None = None,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Full-text search the authenticated user's memories and entries."""
    auth.require("read")
    return service.search_entries(auth.user_id, sb, q, kind)


@app.get("/v1/timeline", tags=["discovery"])
async def timeline(
    from_date: Annotated[datetime | None, Query(alias="from")] = None,
    to_date: Annotated[datetime | None, Query(alias="to")] = None,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Return entries grouped by day for timeline comparisons."""
    auth.require("read")
    return service.get_timeline(
        auth.user_id, sb, from_date=from_date, to_date=to_date
    )


@app.get("/v1/themes", tags=["discovery"])
async def themes(
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Return tag frequency as an honest, non-AI approximation of personal themes."""
    auth.require("read")
    return service.get_themes(auth.user_id, sb)


@app.post("/v1/audio-upload-url", tags=["entries"])
async def audio_upload_url(
    request: AudioUploadRequest,
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Create a direct-to-Supabase signed upload URL; audio bytes never cross this API."""
    auth.require("write")
    result = service.create_audio_upload_url(auth.user_id, sb, request.journal_id)
    if result is None:
        raise not_found()
    return result


@app.get("/v1/me", tags=["account"])
async def me(
    auth: AuthedUser = Depends(require_key),
    sb: Client = Depends(get_supabase),
):
    """Return account context for the API-key owner."""
    auth.require("read")
    return service.get_account(auth.user_id, sb)


@app.post("/v1/keys", status_code=201, tags=["keys"])
async def issue_key(
    request: APIKeyCreate,
    user_id: str = Depends(require_jwt),
    sb: Client = Depends(get_supabase),
):
    """Issue a personal API key. The raw key is returned exactly once."""
    return service.create_api_key(user_id, sb, request)


@app.get("/v1/keys", tags=["keys"])
async def keys(
    user_id: str = Depends(require_jwt),
    sb: Client = Depends(get_supabase),
):
    """List key metadata. Key hashes and raw keys are never returned."""
    return service.list_api_keys(user_id, sb)


@app.post("/v1/keys/{key_id}/revoke", tags=["keys"])
async def revoke_key(
    key_id: str,
    user_id: str = Depends(require_jwt),
    sb: Client = Depends(get_supabase),
):
    """Revoke one key owned by the signed-in user."""
    if not service.revoke_api_key(user_id, sb, key_id):
        raise HTTPException(status_code=404, detail="API key not found")
    return {"revoked": True, "id": key_id}


async def _send_letter(email: str, letter: dict, resend_key: str) -> None:
    escaped = html.escape(letter["content"]).replace("\n", "<br>")
    body = {
        "from": "Dear Future Me <noreply@resend.dev>",
        "to": [email],
        "subject": "Your Letter to Future Self",
        "html": (
            "<h1>Dear Future You,</h1>"
            "<p>Here's the letter you wrote to yourself:</p>"
            f'<div style="background:#f3f4f6;padding:20px;border-radius:8px">{escaped}</div>'
            "<p>Best wishes,<br>Your Past Self</p>"
        ),
    }
    headers = {
        "Authorization": f"Bearer {resend_key}",
        "Content-Type": "application/json",
        "Idempotency-Key": f'dfm-letter-{letter["journal_id"]}',
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post("https://api.resend.com/emails", json=body, headers=headers)
        response.raise_for_status()


@app.get("/v1/cron/deliver-letters", tags=["cron"], include_in_schema=False)
async def deliver_letters(
    x_cron_secret: Annotated[str | None, Header(alias="x-cron-secret")] = None,
    authorization: Annotated[str | None, Header()] = None,
    sb: Client = Depends(get_supabase),
):
    """Deliver due letters. Supports Vercel's Bearer CRON_SECRET and explicit header tests."""
    expected = os.environ.get("CRON_SECRET")
    supplied = x_cron_secret
    if supplied is None and authorization and authorization.startswith("Bearer "):
        supplied = authorization.removeprefix("Bearer ")
    if not expected:
        raise HTTPException(status_code=503, detail="Cron delivery is not configured")
    if not supplied or not secrets_compare(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid cron secret")
    resend_key = os.environ.get("RESEND_API_KEY")
    if not resend_key:
        raise HTTPException(status_code=503, detail="Email delivery is not configured")

    now = datetime.now(timezone.utc)
    due = service.list_due_letters(None, sb, now=now)
    delivered: list[str] = []
    skipped: list[dict[str, str]] = []
    for letter in due:
        user_id = str(letter["user_id"])
        email = service.get_delivery_email(user_id, sb)
        if not email:
            skipped.append({"id": str(letter["journal_id"]), "reason": "no profile email"})
            continue
        try:
            await _send_letter(email, letter, resend_key)
            if service.mark_letter_delivered(user_id, sb, str(letter["journal_id"]), now):
                delivered.append(str(letter["journal_id"]))
        except httpx.HTTPError:
            skipped.append({"id": str(letter["journal_id"]), "reason": "email provider error"})
    return {"due": len(due), "delivered": delivered, "skipped": skipped}


def secrets_compare(left: str, right: str) -> bool:
    import secrets

    return secrets.compare_digest(left.encode("utf-8"), right.encode("utf-8"))


# SPA catch-all — MUST be the last registered route so every real endpoint
# (incl. /docs and /v1/openapi.json) wins first. Serves built assets or falls
# back to index.html for client-side routes like /voice and /notebook.
if _SERVE_SITE:

    @app.get("/{spa_path:path}", include_in_schema=False)
    async def spa_fallback(spa_path: str):
        candidate = (_DIST / spa_path).resolve()
        if (
            spa_path
            and str(candidate).startswith(str(_DIST))
            and candidate.is_file()
        ):
            return FileResponse(candidate)
        return FileResponse(_DIST / "index.html")
