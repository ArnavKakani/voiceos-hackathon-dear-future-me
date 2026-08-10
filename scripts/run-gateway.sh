#!/bin/zsh
# Canonical demo-gateway launcher — THE way to (re)start the DFM backend on
# this Mac. Any session (Claude, Codex, human) should use this instead of a
# bare uvicorn command, so every restart carries the full demo config.
# Secrets come from the macOS keychain; nothing sensitive lives in this file.
set -e
cd "$(dirname "$0")/.."

set -a; source .env 2>/dev/null; set +a  # VITE_SUPABASE_URL / ANON_KEY

export SUPABASE_URL="${SUPABASE_URL:-$VITE_SUPABASE_URL}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-$VITE_SUPABASE_ANON_KEY}"
export DFM_DIRECT_SUPABASE=1
export DFM_DEMO_EMAIL="nebula.markdown+dfmphone@gmail.com"
export DFM_DEMO_PASSWORD="$(security find-generic-password -w -s dfm-demo-pass)"
export DFM_DEMO_API_KEY="$(security find-generic-password -w -s dfm-phone-key)"
export DFM_VOICEOS_ENABLED=1
export DFM_AGENT_UPSTREAM="http://127.0.0.1:8787"
export DFM_PUBLIC_URL="https://dfm.ark404.xyz"
export DFM_SERVE_SITE=1
export ELEVENLABS_API_KEY="$(security find-generic-password -w -s elevenlabs-key)"
export ELEVENLABS_VOICE_ID="pFZP5JQG7iQjIQuC4Bku"   # Lily
export ELEVENLABS_MODEL="eleven_turbo_v2_5"
export A1_TEAM_KEY="$(security find-generic-password -w -s a1-team-key)"
export A1_PHONE_NUMBER="+13862601182"

# one instance only
pkill -f "uvicorn api.index" 2>/dev/null || true
sleep 1
lsof -ti :8787 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

exec uv run --with-requirements requirements.txt --with uvicorn \
  python -m uvicorn api.index:app --host 127.0.0.1 --port 8787
