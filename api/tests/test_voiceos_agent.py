"""Contract tests for the response-only VoiceOS bridge."""

import asyncio

from api._lib import voiceos_agent
from api._lib.voiceos_agent import TurnRequest


def _install_turn(monkeypatch, raw_response):
    sent = []

    def last_rowid():
        return 12

    async def send(prompt):
        sent.append(prompt)

    async def wait(rowid, prompt):
        assert rowid == 12
        assert prompt == sent[-1]
        return raw_response

    monkeypatch.setattr(voiceos_agent, "_last_turn_rowid", last_rowid)
    monkeypatch.setattr(voiceos_agent, "_send_to_voiceos", send)
    monkeypatch.setattr(voiceos_agent, "_wait_for_response", wait)
    return sent


def test_voiceos_is_response_only_and_receives_history(monkeypatch):
    sent = _install_turn(
        monkeypatch,
        '{"speech":"I hear you.","memory":null}',
    )

    async def scenario():
        monkeypatch.setattr(voiceos_agent, "_turn_lock", asyncio.Lock())
        return await voiceos_agent.run_turn(
            TurnRequest(
                text="I feel ready.",
                history=[{"role": "assistant", "text": "Take your time."}],
            ),
            "dfm_live_test",
        )

    result = asyncio.run(scenario())

    assert result["source"] == "voiceos"
    assert result["speech"] == "I hear you."
    assert result["actions"] == []
    assert result["saved"] is None
    assert "DFM: Take your time." in sent[0]
    assert "Do not call or use any tool" in sent[0]


def test_memory_classification_saves_exact_user_words(monkeypatch):
    _install_turn(
        monkeypatch,
        '{"speech":"I’ll keep that for future you.","memory":{"kind":"proud_moment"}}',
    )
    saved = []

    async def save(key, memory, exact_words):
        saved.append((key, memory.kind, exact_words))
        return True

    monkeypatch.setattr(voiceos_agent, "_save_memory", save)

    async def scenario():
        monkeypatch.setattr(voiceos_agent, "_turn_lock", asyncio.Lock())
        return await voiceos_agent.run_turn(
            TurnRequest(text="I shipped the demo even though I was nervous."),
            "dfm_live_test",
        )

    result = asyncio.run(scenario())

    assert saved == [
        (
            "dfm_live_test",
            "proud_moment",
            "I shipped the demo even though I was nervous.",
        )
    ]
    assert result["saved"] == {"kind": "proud_moment", "ok": True}
    assert result["actions"] == []


def test_plain_text_response_never_guesses_a_memory(monkeypatch):
    _install_turn(monkeypatch, "Tell me a little more about that.")

    async def scenario():
        monkeypatch.setattr(voiceos_agent, "_turn_lock", asyncio.Lock())
        return await voiceos_agent.run_turn(
            TurnRequest(text="Maybe."),
            "dfm_live_test",
        )

    result = asyncio.run(scenario())
    assert result["speech"] == "Tell me a little more about that."
    assert result["saved"] is None
