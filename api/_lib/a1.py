"""A1Mobile client: SMS + phone verification for Dear Future Me.

Used to text a future letter to the user's own (OTP-verified) phone when its
delivery date arrives, and to run the consent (OTP) flow. The team key is held
server-side (env A1_TEAM_KEY); the phone never sees it.

A1 policy: you may only text numbers the team has OTP-verified, so the flow is
request_verification -> user texts back the code -> confirm_verification, then
send_sms is allowed.
"""

from __future__ import annotations

import os

import httpx

BASE = "https://hack.a1mobile.com"
TEAM_KEY = os.environ.get("A1_TEAM_KEY", "").strip()
OUR_NUMBER = os.environ.get("A1_PHONE_NUMBER", "").strip()

ENABLED = bool(TEAM_KEY)


def _headers() -> dict[str, str]:
    return {"X-Team-Key": TEAM_KEY, "Content-Type": "application/json"}


async def request_verification(phone: str) -> tuple[int, dict]:
    """Send an OTP to `phone` so the team can later text it (consent)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{BASE}/api/verified-numbers", headers=_headers(), json={"phone": phone}
        )
    return r.status_code, _json(r)


async def confirm_verification(phone: str, code: str) -> tuple[int, dict]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{BASE}/api/verified-numbers/confirm",
            headers=_headers(),
            json={"phone": phone, "code": code},
        )
    return r.status_code, _json(r)


async def send_sms(to: str, body: str) -> tuple[int, dict]:
    """Text a verified number. Fails at A1 if `to` isn't verified."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(
            f"{BASE}/api/sms", headers=_headers(), json={"to": to, "body": body}
        )
    return r.status_code, _json(r)


def _json(r: httpx.Response) -> dict:
    try:
        return r.json()
    except ValueError:
        return {"raw": r.text[:300]}
