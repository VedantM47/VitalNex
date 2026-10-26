"""
Supabase JWT verification, current user and role guards.

The browser signs in with Supabase Auth and sends `Authorization: Bearer <access token>`.
Tokens are verified locally:
- asymmetric signing keys (ES256 / RS256): public JWKS at
  <SUPABASE_URL>/auth/v1/.well-known/jwks.json (the default for new projects);
- legacy shared secret (HS256): only if SUPABASE_JWT_SECRET is set.

The role always comes from `profiles.role` in the database, never from the token or
from anything the user picked on a login page.
"""

from dataclasses import dataclass
from functools import lru_cache
from typing import AsyncIterator, Optional

import jwt
from fastapi import Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from postgrest import AsyncPostgrestClient

from apps.api.core.config import settings
from apps.api.core.db import service_db, user_db

ROLES = ("patient", "doctor", "admin")
ASYMMETRIC_ALGORITHMS = ["ES256", "RS256"]
AUDIENCE = "authenticated"

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    role: str
    email: Optional[str]
    access_token: str


def _unauthorized(detail: str = "Not signed in or session expired.") -> HTTPException:
    return HTTPException(status_code=401, detail=detail, headers={"WWW-Authenticate": "Bearer"})


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient:
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
    return jwt.PyJWKClient(url, cache_keys=True, lifespan=3600)


def _decode(token: str) -> dict:
    """Verify signature, expiry and audience. Raises jwt.PyJWTError on any failure."""
    alg = jwt.get_unverified_header(token).get("alg")
    if alg == "HS256":
        if not settings.SUPABASE_JWT_SECRET:
            raise jwt.InvalidAlgorithmError("HS256 token but SUPABASE_JWT_SECRET is not set")
        key = settings.SUPABASE_JWT_SECRET
        algorithms = ["HS256"]
    elif alg in ASYMMETRIC_ALGORITHMS:
        if not settings.SUPABASE_URL:
            raise jwt.InvalidKeyError("SUPABASE_URL is not set, cannot fetch JWKS")
        key = _jwks_client().get_signing_key_from_jwt(token).key
        algorithms = [alg]
    else:
        raise jwt.InvalidAlgorithmError(f"Unsupported JWT algorithm: {alg}")
    return jwt.decode(
        token,
        key,
        algorithms=algorithms,
        audience=AUDIENCE,
        options={"require": ["exp", "sub"]},
    )


async def verify_token(token: str) -> dict:
    try:
        # The JWKS fetch is blocking network I/O (cached afterwards).
        return await run_in_threadpool(_decode, token)
    except jwt.PyJWTError:
        raise _unauthorized()


async def lookup_role(user_id: str) -> Optional[str]:
    """profiles.role for this user, read with the service role."""
    res = await service_db().table("profiles").select("role").eq("id", user_id).limit(1).execute()
    return res.data[0]["role"] if res.data else None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()
    claims = await verify_token(credentials.credentials)
    role = await lookup_role(claims["sub"])
    if role not in ROLES:
        raise HTTPException(status_code=403, detail="No VITALNEX profile for this account.")
    return CurrentUser(id=claims["sub"], role=role, email=claims.get("email"), access_token=credentials.credentials)


def require_role(*allowed: str):
    """Dependency factory: `Depends(require_role("doctor"))`. 'doctor' is the clinician role."""
    unknown = set(allowed) - set(ROLES)
    if unknown:
        raise ValueError(f"Unknown role(s): {unknown}")

    async def guard(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed:
            raise HTTPException(status_code=403, detail="You do not have access to this area.")
        return user

    return guard


async def get_user_db(user: CurrentUser = Depends(get_current_user)) -> AsyncIterator[AsyncPostgrestClient]:
    """PostgREST client acting as the signed-in user, so RLS applies."""
    client = user_db(user.access_token)
    try:
        yield client
    finally:
        await client.aclose()
