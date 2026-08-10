#!/usr/bin/env python3
"""Mint a DFM test key after migrations are applied; never commits the raw key."""

import argparse
import os
from pathlib import Path

from supabase import create_client

from api._lib.schemas import APIKeyCreate
from api._lib.service import create_api_key


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        default=".dfm_test_key",
        help="Ignored, chmod-600 file that receives the raw key",
    )
    args = parser.parse_args()
    required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DFM_TEST_USER_ID"]
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        parser.error(f"missing environment variables: {', '.join(missing)}")
    sb = create_client(
        os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    )
    issued = create_api_key(
        os.environ["DFM_TEST_USER_ID"],
        sb,
        APIKeyCreate(name="overnight verification", scopes=["read", "write"]),
    )
    destination = Path(args.output)
    destination.write_text(issued["key"] + "\n")
    destination.chmod(0o600)
    print(f"Created {issued['key_hint']}… and saved it to {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
