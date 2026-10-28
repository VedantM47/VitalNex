"""
Core configuration settings for VITALNEX API.
"""

from typing import List
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "VITALNEX API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Supabase. Empty means "not configured": endpoints that need the database answer 503
    # instead of falling back to fake data.
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""  # service role, server-side only
    # Publishable (anon) key, sent as `apikey` on requests made with a user's JWT so RLS applies.
    SUPABASE_PUBLISHABLE_KEY: str = Field(
        "", validation_alias=AliasChoices("SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    )
    # Only for projects still on the legacy shared JWT secret (HS256). Projects with
    # asymmetric signing keys are verified against the public JWKS and leave this empty.
    SUPABASE_JWT_SECRET: str = ""

    # Shared password for the dummy demo accounts (seed script and live tests only).
    DEMO_PASSWORD: str = ""

    # Public web app URL, used to build QR share links (<url>/share/<token>).
    PUBLIC_WEB_URL: str = Field(
        "http://localhost:3000", validation_alias=AliasChoices("PUBLIC_WEB_URL", "NEXT_PUBLIC_SITE_URL")
    )
    # Where people report a problem with VITALNEX (shown in the Trust Passport). Empty means
    # "not available" — no invented address is shown.
    PROBLEM_REPORT_CONTACT: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_SECRET_KEY and "your-project-id" not in self.SUPABASE_URL)


settings = Settings()
