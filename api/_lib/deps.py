import hashlib
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client


api_key_header = APIKeyHeader(
    name="x-api-key",
    scheme_name="ApiKeyAuth",
    description="Personal Dear Future Me API key (dfm_live_…).",
    auto_error=False,
)
bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthedUser:
    user_id: str
    scopes: frozenset[str]

    def require(self, scope: str) -> None:
        if scope not in self.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"API key requires the '{scope}' scope",
            )


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase is not configured",
        )
    return create_client(url, key)


async def require_key(
    key: str | None = Depends(api_key_header),
    sb: Client = Depends(get_supabase),
) -> AuthedUser:
    if not key:
        raise HTTPException(status_code=401, detail="Missing x-api-key")
    key_hash = hashlib.sha256(key.encode("utf-8")).hexdigest()
    result = (
        sb.table("api_keys")
        .select("id,user_id,scopes")
        .eq("key_hash", key_hash)
        .is_("revoked_at", "null")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid API key")
    row = result.data[0]
    sb.table("api_keys").update(
        {"last_used_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", row["id"]).execute()
    return AuthedUser(str(row["user_id"]), frozenset(row.get("scopes") or []))


async def require_jwt(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    sb: Client = Depends(get_supabase),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        response = sb.auth.get_user(credentials.credentials)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid bearer token") from exc
    user = getattr(response, "user", None)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid bearer token")
    return str(user.id)
