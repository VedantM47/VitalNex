"""
Supabase data access (PostgREST via supabase-py's `postgrest` client).

Two kinds of client:
- `user_db(user)`: carries the signed-in user's JWT, so Postgres RLS decides what the
  request can see. Used for every read a user makes about themselves or their patients.
- `service_db()`: the service role, bypasses RLS. Used only for writes the user must not
  be able to forge (assessments, bookings, audit) and for role lookups.

Why PostgREST and not psycopg: the API never needs the database password, RLS is
enforced for user requests by forwarding the JWT, and it is the same access path the
browser uses, so the RLS tests cover both.
"""

from functools import lru_cache

from fastapi import HTTPException
from postgrest import AsyncPostgrestClient

from apps.api.core.config import settings

DB_NOT_CONFIGURED = "Database is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env."


def _require_configured() -> None:
    if not settings.supabase_configured:
        raise HTTPException(status_code=503, detail=DB_NOT_CONFIGURED)


def _rest_url() -> str:
    return f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1"


@lru_cache(maxsize=1)
def _service_client() -> AsyncPostgrestClient:
    key = settings.SUPABASE_SECRET_KEY
    headers = {"apikey": key}
    # Legacy service_role keys are JWTs and go in Authorization; new sb_secret_ keys are
    # recognised by the gateway from `apikey` alone.
    if not key.startswith("sb_"):
        headers["Authorization"] = f"Bearer {key}"
    return AsyncPostgrestClient(_rest_url(), headers=headers)


def service_db() -> AsyncPostgrestClient:
    _require_configured()
    return _service_client()


def user_db(access_token: str) -> AsyncPostgrestClient:
    _require_configured()
    if not settings.SUPABASE_PUBLISHABLE_KEY:
        raise HTTPException(status_code=503, detail="SUPABASE_PUBLISHABLE_KEY is not set in .env.")
    return AsyncPostgrestClient(
        _rest_url(),
        headers={
            "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
            "Authorization": f"Bearer {access_token}",
        },
    )
