"""Vercel-free data backend: serve /v1 straight from Supabase PostgREST.

Hackathon fallback for when the deployed API is down. Enabled with
DFM_DIRECT_SUPABASE=1. A single demo account (email+password) is signed in
with the anon key; per-user RLS scopes every write to that account, so no
service-role key is needed. Any request bearing the configured demo API key
maps to that account.

Env:
  DFM_DIRECT_SUPABASE=1
  SUPABASE_URL, SUPABASE_ANON_KEY   (anon is enough — RLS does the scoping)
  DFM_DEMO_EMAIL, DFM_DEMO_PASSWORD (the account entries land in)
  DFM_DEMO_API_KEY                  (the dfm_live_ key the phone/notch send)

Response shapes mirror the real API: bare arrays of journal rows with the
real column names (journal_id, type, content, tags, revisit_at, ...), so the
iOS client and the VoiceOS server.ts need no changes.
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from typing import Any

import httpx

ENABLED = os.environ.get("DFM_DIRECT_SUPABASE", "") == "1"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
ANON = os.environ.get("SUPABASE_ANON_KEY", "")
DEMO_EMAIL = os.environ.get("DFM_DEMO_EMAIL", "")
DEMO_PASSWORD = os.environ.get("DFM_DEMO_PASSWORD", "")
DEMO_API_KEY = os.environ.get("DFM_DEMO_API_KEY", "")

_session: dict[str, Any] = {"jwt": None, "uid": None, "exp": 0.0}


class DirectError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail


async def _auth(client: httpx.AsyncClient) -> tuple[str, str]:
    """Return (jwt, uid), signing in / refreshing the demo account as needed."""
    now = time.time()
    if _session["jwt"] and now < _session["exp"] - 60:
        return _session["jwt"], _session["uid"]
    resp = await client.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON, "content-type": "application/json"},
        json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
    )
    if resp.status_code != 200:
        raise DirectError(503, "Demo account sign-in failed.")
    body = resp.json()
    _session["jwt"] = body["access_token"]
    _session["uid"] = body["user"]["id"]
    _session["exp"] = now + float(body.get("expires_in", 3600))
    return _session["jwt"], _session["uid"]


def _rest_headers(jwt: str, extra: dict[str, str] | None = None) -> dict[str, str]:
    h = {
        "apikey": ANON,
        "authorization": f"Bearer {jwt}",
        "content-type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def authorize(api_key: str | None) -> bool:
    """Accept the configured demo key. Constant-time-ish; single account."""
    return bool(api_key) and bool(DEMO_API_KEY) and api_key == DEMO_API_KEY


def onboarding_signup(name: str, email: str) -> dict[str, Any]:
    """Connect any hackathon signup to the preconfigured tunnel account."""
    if not DEMO_API_KEY:
        raise DirectError(503, "The demo account is not configured.")
    return {
        "account": {
            "id": "cloudflare-demo-account",
            "email": email,
            "name": name,
        },
        "api_key": {
            "id": "cloudflare-demo-key",
            "name": "DFM Voice demo",
            "key": DEMO_API_KEY,
            "key_hint": DEMO_API_KEY[:12],
            "scopes": ["read", "write"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    }


async def handle(method: str, path: str, params: dict[str, Any], body: dict[str, Any]):
    """Dispatch a /v1 data route. Returns (status_code, json_body)."""
    async with httpx.AsyncClient(timeout=12.0) as client:
        jwt, uid = await _auth(client)
        rest = f"{SUPABASE_URL}/rest/v1/journals"

        # -- writes -------------------------------------------------------
        if method == "POST" and path == "/v1/entries":
            row = {
                "type": body.get("kind", "note"),
                "content": body.get("content", ""),
                "title": body.get("title"),
                "tags": body.get("tags") or [],
                "context": body.get("context"),
                "transcript": body.get("transcript"),
                "user_id": uid,
                "is_public": False,
            }
            resp = await client.post(
                rest, headers=_rest_headers(jwt, {"Prefer": "return=representation"}),
                json={k: v for k, v in row.items() if v is not None},
            )
            return _one(resp)

        if method == "POST" and path == "/v1/letters":
            row = {
                "type": "letter",
                "content": body.get("content", ""),
                "title": body.get("title"),
                "tags": body.get("tags") or [],
                "revisit_at": body.get("revisit_at"),
                "user_id": uid,
                "is_public": False,
            }
            resp = await client.post(
                rest, headers=_rest_headers(jwt, {"Prefer": "return=representation"}),
                json={k: v for k, v in row.items() if v is not None},
            )
            return _one(resp)

        # -- reads --------------------------------------------------------
        if method == "GET" and path == "/v1/entries":
            q = {"select": "*", "order": "created_at.desc", "user_id": f"eq.{uid}"}
            if params.get("kind"):
                q["type"] = f"eq.{params['kind']}"
            q["limit"] = str(params.get("limit", 25))
            resp = await client.get(rest, headers=_rest_headers(jwt), params=q)
            return _many(resp)

        if method == "GET" and path == "/v1/letters":
            q = {"select": "*", "type": "eq.letter", "user_id": f"eq.{uid}",
                 "order": "revisit_at.asc", "limit": str(params.get("limit", 50))}
            resp = await client.get(rest, headers=_rest_headers(jwt), params=q)
            return _many(resp)

        if method == "GET" and path == "/v1/search":
            term = params.get("q", "")
            q = {"select": "*", "user_id": f"eq.{uid}",
                 "content": f"ilike.*{term}*", "order": "created_at.desc", "limit": "20"}
            resp = await client.get(rest, headers=_rest_headers(jwt), params=q)
            return _many(resp)

        if method == "GET" and path == "/v1/themes":
            q = {"select": "tags", "user_id": f"eq.{uid}", "limit": "1000"}
            resp = await client.get(rest, headers=_rest_headers(jwt), params=q)
            if resp.status_code >= 300:
                return resp.status_code, {"detail": "themes failed"}
            counts: dict[str, int] = {}
            for r in resp.json():
                for t in (r.get("tags") or []):
                    counts[t] = counts.get(t, 0) + 1
            top = sorted(counts.items(), key=lambda kv: -kv[1])[:25]
            return 200, [{"theme": t, "count": c} for t, c in top]

        if method == "GET" and path == "/v1/timeline":
            q = {"select": "*", "user_id": f"eq.{uid}",
                 "order": "created_at.desc", "limit": "500"}
            resp = await client.get(rest, headers=_rest_headers(jwt), params=q)
            if resp.status_code >= 300:
                return resp.status_code, {"detail": "timeline failed"}
            groups: dict[str, list] = {}
            for r in resp.json():
                day = str(r.get("entry_date") or r.get("created_at") or "")[:10]
                groups.setdefault(day, []).append(r)
            return 200, [{"date": d, "entries": groups[d]} for d in sorted(groups, reverse=True)]

        if method == "GET" and path == "/v1/me":
            return 200, {"id": uid, "email": DEMO_EMAIL, "name": None}

        raise DirectError(404, "No such route in direct mode.")


def _one(resp: httpx.Response):
    if resp.status_code >= 300:
        return resp.status_code, {"detail": resp.text[:200]}
    data = resp.json()
    return 201, (data[0] if isinstance(data, list) and data else data)


def _many(resp: httpx.Response):
    if resp.status_code >= 300:
        return resp.status_code, {"detail": resp.text[:200]}
    return 200, resp.json()
