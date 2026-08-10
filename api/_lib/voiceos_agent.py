"""Conversation bridge from the DFM mobile app to the local VoiceOS agent.

VoiceOS exposes integrations as tools, not as a public chat HTTP endpoint. For
the local hackathon preview, VoiceOS is launched with Electron's loopback-only
Chrome DevTools port. This module sends text through VoiceOS's own
``agent-text-send`` renderer bridge, then reads the completed turn from the
VoiceOS SQLite history.

The VoiceOS turn is response-only: the prompt explicitly forbids tools and
desktop actions. VoiceOS may classify one verbatim DFM memory in its JSON
reply, but this gateway owns the actual database write with the caller's DFM
key. That keeps conversation and storage separate and auditable.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sqlite3
import time
import uuid
from pathlib import Path
from typing import Any, Literal

import httpx
from pydantic import BaseModel, Field
from websockets.asyncio.client import connect


AGENT_ENABLED = os.environ.get("DFM_VOICEOS_ENABLED", "") == "1"
UPSTREAM = os.environ.get(
    "DFM_AGENT_UPSTREAM", "https://dear-future-me-phi.vercel.app"
).rstrip("/")
CDP_HTTP = os.environ.get("DFM_VOICEOS_CDP", "http://127.0.0.1:47841").rstrip("/")
VOICEOS_DB = Path(
    os.environ.get(
        "DFM_VOICEOS_DB",
        str(Path.home() / "Library/Application Support/VoiceOS/voiceos.db"),
    )
)
TURN_TIMEOUT_S = float(os.environ.get("DFM_VOICEOS_TIMEOUT_S", "75"))
MAX_HISTORY_TURNS = 8
MAX_SPEECH_CHARS = 700

_turn_lock = asyncio.Lock()
_key_cache: dict[str, float] = {}
_KEY_TTL_S = 300.0
_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


class TurnRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    history: list[dict[str, str]] = Field(default_factory=list)


class MemoryDecision(BaseModel):
    kind: Literal["reflection", "memory", "proud_moment"]


def _build_prompt(request: TurnRequest, marker: str) -> str:
    history_lines: list[str] = []
    for turn in request.history[-MAX_HISTORY_TURNS:]:
        role = "User" if turn.get("role") == "user" else "DFM"
        text = str(turn.get("text", ""))[:500]
        history_lines.append(f"{role}: {text}")
    history = "\n".join(history_lines) if history_lines else "(new conversation)"

    return f"""[DFM VoiceOS bridge {marker}]
You are the conversational voice of Dear Future Me. You are a warm, grounded,
unhurried companion for reflection. You are not a therapist, coach, or doctor.
Write for the ear: one to three short sentences, no markdown, no lists, no
emoji, no stage directions, and no exaggerated praise.

STRICT RESPONSE-ONLY RULE: Do not call or use any tool, integration, MCP
server, calendar, browser, application, computer action, or confirmation flow.
Do not manipulate the desktop. Your only job is to return the JSON response
described below.

Conversation so far:
{history}

Current user words:
{request.text}

Decide whether these current words should also be kept in the DFM notebook.
Set memory only when the user explicitly asks to save/remember something, when
the session context says this is a proud moment or memory, or when they share a
complete personal reflection clearly worth keeping. Never save greetings,
questions, logistics, or crisis/distress content. If memory is set, its kind is
reflection, memory, or proud_moment. The gateway will save the user's exact
words; you do not perform that action.

Return exactly one JSON object and nothing else:
{{"speech":"short spoken response","memory":null}}
or
{{"speech":"short spoken response confirming it will be kept","memory":{{"kind":"reflection|memory|proud_moment"}}}}

Final reminder: respond only. Do not use tools or take actions."""


async def _cdp_websocket_url() -> str:
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(f"{CDP_HTTP}/json/list")
        response.raise_for_status()
    targets = response.json()
    for target in targets:
        if str(target.get("url", "")).endswith("#/agent-notch"):
            url = str(target.get("webSocketDebuggerUrl", ""))
            if url:
                return url
    raise RuntimeError("VoiceOS agent window is not available")


async def _send_to_voiceos(prompt: str) -> None:
    ws_url = await _cdp_websocket_url()
    encoded_prompt = json.dumps(prompt)
    expression = f"""
(() => {{
  const settings = window.electron?.store?.get?.("settings");
  if (settings) {{
    settings.agentVoiceEnabled = false;
    window.electron.store.set("settings", settings);
    window.api.notifySettingsUpdate?.(settings);
  }}
  if (!window.api?.send) throw new Error("VoiceOS agent bridge unavailable");
  window.api.send("agent-text-send", {{ text: {encoded_prompt}, screenshots: [] }});
  return true;
}})()
"""

    async with connect(ws_url, open_timeout=5, close_timeout=2, max_size=2**20) as ws:
        await ws.send(
            json.dumps(
                {
                    "id": 1,
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": expression,
                        "awaitPromise": True,
                        "returnByValue": True,
                    },
                }
            )
        )
        while True:
            raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
            message = json.loads(raw)
            if message.get("id") != 1:
                continue
            if message.get("error") or message.get("result", {}).get("exceptionDetails"):
                raise RuntimeError("VoiceOS rejected the local bridge request")
            return


def _last_turn_rowid() -> int:
    with sqlite3.connect(VOICEOS_DB, timeout=2.0) as db:
        row = db.execute("SELECT COALESCE(MAX(rowid), 0) FROM agent_turns").fetchone()
    return int(row[0] if row else 0)


def _find_turn_after(rowid: int, prompt: str) -> tuple[str, str | None] | None:
    with sqlite3.connect(VOICEOS_DB, timeout=2.0) as db:
        row = db.execute(
            """
            SELECT status, assistant_response
            FROM agent_turns
            WHERE rowid > ? AND user_message = ?
            ORDER BY rowid DESC
            LIMIT 1
            """,
            (rowid, prompt),
        ).fetchone()
    if row is None:
        return None
    return str(row[0]), None if row[1] is None else str(row[1])


async def _wait_for_response(rowid: int, prompt: str) -> str:
    deadline = time.monotonic() + TURN_TIMEOUT_S
    while time.monotonic() < deadline:
        row = await asyncio.to_thread(_find_turn_after, rowid, prompt)
        if row is not None:
            status, response = row
            if status == "completed":
                if response and response.strip():
                    return response.strip()
                raise RuntimeError("VoiceOS completed without a response")
            if status in {"failed", "cancelled", "error"}:
                raise RuntimeError("VoiceOS could not complete the turn")
        await asyncio.sleep(0.2)
    raise RuntimeError("VoiceOS response timed out")


def _parse_contract(raw: str) -> tuple[str, MemoryDecision | None]:
    cleaned = _FENCE.sub("", raw).strip()
    try:
        payload = json.loads(cleaned)
    except (TypeError, ValueError, json.JSONDecodeError):
        # VoiceOS occasionally answers in plain text despite a JSON request.
        # The conversation remains usable, but no storage decision is guessed.
        return cleaned[:MAX_SPEECH_CHARS], None

    speech = str(payload.get("speech", "")).strip()[:MAX_SPEECH_CHARS]
    memory: MemoryDecision | None = None
    if isinstance(payload.get("memory"), dict):
        try:
            memory = MemoryDecision.model_validate(payload["memory"])
        except ValueError:
            memory = None
    return speech, memory


async def _save_memory(key: str, memory: MemoryDecision, exact_words: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                f"{UPSTREAM}/v1/entries",
                headers={"x-api-key": key},
                json={"kind": memory.kind, "content": exact_words},
            )
        return response.status_code < 300
    except httpx.HTTPError:
        return False


async def validate_key(client: httpx.AsyncClient, key: str) -> bool:
    now = time.monotonic()
    cached = _key_cache.get(key)
    if cached is not None and now - cached < _KEY_TTL_S:
        return True
    try:
        response = await client.get(f"{UPSTREAM}/v1/me", headers={"x-api-key": key})
    except httpx.HTTPError:
        return False
    if response.status_code == 200:
        _key_cache[key] = now
        return True
    return False


async def run_turn(request: TurnRequest, key: str) -> dict[str, Any]:
    async with _turn_lock:
        marker = uuid.uuid4().hex
        prompt = _build_prompt(request, marker)
        baseline = await asyncio.to_thread(_last_turn_rowid)
        await _send_to_voiceos(prompt)
        raw = await _wait_for_response(baseline, prompt)

    speech, memory = _parse_contract(raw)
    if not speech:
        speech = "I'm here. Tell me a little more."

    saved: dict[str, Any] | None = None
    if memory is not None:
        ok = await _save_memory(key, memory, request.text)
        saved = {"kind": memory.kind, "ok": ok}
        if not ok:
            speech = "I heard you, but I couldn't save that just now. It's safe to try again."

    return {
        "speech": speech,
        "actions": [],
        "saved": saved,
        "source": "voiceos",
    }
