import hashlib
import secrets
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

from supabase import Client

from .schemas import APIKeyCreate, EntryCreate, EntryUpdate, MobileSignupCreate


ENTRY_SELECT = (
    "journal_id,user_id,type,title,content,entry_date,created_at,updated_at,"
    "tags,transcript,audio_path,revisit_at,delivered_at,context,source,provenance"
)


def _one(data: list[dict[str, Any]]) -> dict[str, Any] | None:
    return data[0] if data else None


def create_entry(user_id: str, sb: Client, entry: EntryCreate) -> dict[str, Any]:
    values = entry.model_dump(mode="json")
    values["type"] = values.pop("kind")
    values.update({"user_id": user_id, "source": "api", "is_public": False})
    return sb.table("journals").insert(values).execute().data[0]


def get_entry(user_id: str, sb: Client, entry_id: str) -> dict[str, Any] | None:
    result = (
        sb.table("journals")
        .select(ENTRY_SELECT)
        .eq("user_id", user_id)
        .eq("journal_id", entry_id)
        .limit(1)
        .execute()
    )
    return _one(result.data)


def update_entry(
    user_id: str, sb: Client, entry_id: str, update: EntryUpdate
) -> dict[str, Any] | None:
    values = update.model_dump(mode="json", exclude_unset=True)
    values["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = (
        sb.table("journals")
        .update(values)
        .eq("user_id", user_id)
        .eq("journal_id", entry_id)
        .execute()
    )
    return _one(result.data)


def delete_entry(user_id: str, sb: Client, entry_id: str) -> bool:
    result = (
        sb.table("journals")
        .delete()
        .eq("user_id", user_id)
        .eq("journal_id", entry_id)
        .execute()
    )
    return bool(result.data)


def list_entries(
    user_id: str,
    sb: Client,
    *,
    kind: str | None = None,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    query = sb.table("journals").select(ENTRY_SELECT).eq("user_id", user_id)
    if kind:
        query = query.eq("type", kind)
    if from_date:
        query = query.gte("created_at", from_date.isoformat())
    if to_date:
        query = query.lte("created_at", to_date.isoformat())
    return query.order("created_at", desc=True).limit(limit).execute().data


def list_letters(
    user_id: str, sb: Client, *, status: str, limit: int = 50
) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc).isoformat()
    query = (
        sb.table("journals")
        .select(ENTRY_SELECT)
        .eq("user_id", user_id)
        .eq("type", "letter")
    )
    if status == "upcoming":
        query = query.gte("revisit_at", now).is_("delivered_at", "null")
        return query.order("revisit_at").limit(limit).execute().data
    query = query.lt("revisit_at", now)
    return query.order("revisit_at", desc=True).limit(limit).execute().data


def search_entries(
    user_id: str, sb: Client, query: str, kind: str | None = None
) -> list[dict[str, Any]]:
    params = {
        "search_query": query,
        "requesting_user_id": user_id,
        "entry_kind": kind,
    }
    return sb.rpc("search_entries", params).execute().data


def get_timeline(
    user_id: str,
    sb: Client,
    *,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
) -> list[dict[str, Any]]:
    rows = list_entries(
        user_id, sb, from_date=from_date, to_date=to_date, limit=500
    )
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        stamp = row.get("entry_date") or row.get("created_at") or ""
        grouped[str(stamp)[:10]].append(row)
    return [{"date": day, "entries": grouped[day]} for day in sorted(grouped, reverse=True)]


def get_themes(user_id: str, sb: Client) -> list[dict[str, Any]]:
    rows = (
        sb.table("journals")
        .select("tags")
        .eq("user_id", user_id)
        .limit(1000)
        .execute()
        .data
    )
    counts = Counter(tag for row in rows for tag in (row.get("tags") or []))
    return [{"theme": tag, "count": count} for tag, count in counts.most_common(25)]


def create_audio_upload_url(
    user_id: str, sb: Client, journal_id: str
) -> dict[str, Any] | None:
    if get_entry(user_id, sb, journal_id) is None:
        return None
    path = f"{user_id}/{journal_id}.m4a"
    result = sb.storage.from_("voice-audio").create_signed_upload_url(path)
    return {"path": path, **result}


def create_api_key(
    user_id: str, sb: Client, request: APIKeyCreate
) -> dict[str, Any]:
    raw_key = f"dfm_live_{secrets.token_urlsafe(32)}"
    row = {
        "user_id": user_id,
        "name": request.name,
        "key_hash": hashlib.sha256(raw_key.encode("utf-8")).hexdigest(),
        "key_hint": raw_key[:12],
        "scopes": request.scopes,
    }
    created = sb.table("api_keys").insert(row).execute().data[0]
    return {
        "id": str(created["id"]),
        "name": created["name"],
        "key": raw_key,
        "key_hint": created["key_hint"],
        "scopes": created["scopes"],
        "created_at": created["created_at"],
    }


def create_mobile_account(
    sb: Client, request: MobileSignupCreate
) -> dict[str, Any]:
    """Create one isolated DFM account and return its first agent API key.

    The service-role credential never leaves the backend. The mobile app gets
    only the one-time raw DFM key, exactly like the signed-in /v1/keys flow.
    """
    created = sb.auth.admin.create_user(
        {
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
            "user_metadata": {
                "name": request.name,
                "full_name": request.name,
                "created_via": "ios_voice",
            },
        }
    )
    user = created.user
    if user is None:
        raise RuntimeError("Supabase did not return the created user")

    try:
        key = create_api_key(
            str(user.id),
            sb,
            APIKeyCreate(name="DFM Voice iPhone", scopes=["read", "write"]),
        )
    except Exception:
        # Keep retries safe: if key setup fails, do not strand an account that
        # the person cannot connect to from the app.
        try:
            sb.auth.admin.delete_user(str(user.id))
        except Exception:
            pass
        raise
    return {
        "account": {
            "id": str(user.id),
            "email": user.email or request.email,
            "name": request.name,
        },
        "api_key": key,
    }


def list_api_keys(user_id: str, sb: Client) -> list[dict[str, Any]]:
    return (
        sb.table("api_keys")
        .select("id,name,key_hint,scopes,created_at,last_used_at,revoked_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )


def revoke_api_key(user_id: str, sb: Client, key_id: str) -> bool:
    result = (
        sb.table("api_keys")
        .update({"revoked_at": datetime.now(timezone.utc).isoformat()})
        .eq("user_id", user_id)
        .eq("id", key_id)
        .is_("revoked_at", "null")
        .execute()
    )
    return bool(result.data)


def get_account(user_id: str, sb: Client) -> dict[str, Any]:
    profile = (
        sb.table("profiles")
        .select("id,name,email,created_at")
        .eq("id", user_id)
        .limit(1)
        .execute()
        .data
    )
    return _one(profile) or {"id": user_id}


def list_due_letters(
    user_id: str | None, sb: Client, *, now: datetime
) -> list[dict[str, Any]]:
    """List due letters. A null user is reserved for the authenticated system cron."""
    query = (
        sb.table("journals")
        .select(ENTRY_SELECT)
        .eq("type", "letter")
        .lte("revisit_at", now.isoformat())
        .is_("delivered_at", "null")
    )
    if user_id is not None:
        query = query.eq("user_id", user_id)
    return query.order("revisit_at").limit(100).execute().data


def mark_letter_delivered(
    user_id: str, sb: Client, journal_id: str, delivered_at: datetime
) -> bool:
    result = (
        sb.table("journals")
        .update({"delivered_at": delivered_at.isoformat()})
        .eq("user_id", user_id)
        .eq("journal_id", journal_id)
        .is_("delivered_at", "null")
        .execute()
    )
    return bool(result.data)


def get_delivery_email(user_id: str, sb: Client) -> str | None:
    rows = (
        sb.table("profiles")
        .select("email")
        .eq("id", user_id)
        .limit(1)
        .execute()
        .data
    )
    return rows[0].get("email") if rows else None
