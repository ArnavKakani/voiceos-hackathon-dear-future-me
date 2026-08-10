#!/usr/bin/env python3
"""Small Gemini function-calling demo for the Dear Future Me API."""

import json
import os
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx
from google import genai
from google.genai import types


BASE_URL = os.environ.get("DFM_API_URL", "http://localhost:8000").rstrip("/")
DFM_KEY = os.environ.get("DFM_API_KEY")
MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")


def call_dfm(name: str, args: dict[str, Any]) -> Any:
    headers = {"x-api-key": DFM_KEY or ""}
    with httpx.Client(base_url=BASE_URL, headers=headers, timeout=20) as client:
        if name == "save_entry":
            response = client.post("/v1/entries", json=args)
        elif name == "create_future_letter":
            response = client.post("/v1/letters", json=args)
        elif name == "search_memories":
            response = client.get("/v1/search", params=args)
        elif name == "get_entries":
            response = client.get("/v1/entries", params=args)
        elif name == "get_timeline":
            response = client.get("/v1/timeline", params=args)
        elif name == "read_letter":
            response = client.get(f'/v1/letters/{quote(str(args["entry_id"]), safe="")}')
        elif name == "get_themes":
            response = client.get("/v1/themes")
        elif name == "get_account":
            response = client.get("/v1/me")
        else:
            raise ValueError(f"Unsupported function: {name}")
    response.raise_for_status()
    return response.json()


def main() -> int:
    if not DFM_KEY or not os.environ.get("GEMINI_API_KEY"):
        print("Set GEMINI_API_KEY and DFM_API_KEY before running this demo.", file=sys.stderr)
        return 2
    declarations = json.loads(
        Path(__file__).with_name("function_declarations.json").read_text()
    )
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    prompt = " ".join(sys.argv[1:]) or (
        "Save a proud moment that I deployed my first API, then search for memories about deploying."
    )
    contents: list[types.Content] = [
        types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
    ]
    config = types.GenerateContentConfig(
        system_instruction=(
            "You are a concise Dear Future Me companion. Use tools for all DFM data. "
            "Never claim a write succeeded until its tool result succeeds."
        ),
        tools=[types.Tool(function_declarations=declarations)],
    )
    for _ in range(8):
        response = client.models.generate_content(
            model=MODEL, contents=contents, config=config
        )
        if not response.function_calls:
            print(response.text or "Done.")
            return 0
        contents.append(response.candidates[0].content)
        parts = []
        for function_call in response.function_calls:
            result = call_dfm(function_call.name, dict(function_call.args or {}))
            parts.append(
                types.Part.from_function_response(
                    name=function_call.name, response={"result": result}
                )
            )
        contents.append(types.Content(role="tool", parts=parts))
    print("Gemini exceeded the eight-step tool limit.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
