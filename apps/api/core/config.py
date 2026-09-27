"""
Core configuration settings for VITALNEX API.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "VITALNEX API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True

    # Security & CORS
    SECRET_KEY: str = "vitalnex-dev-secret-key-change-in-production-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://vitalnex.vercel.app",
    ]

    # Supabase (Optional in local Demo Mode)
    SUPABASE_URL: str = "https://demo.vitalnex.supabase.co"
    SUPABASE_SECRET_KEY: str = "demo-service-role-key"

    # Dataset Paths
    DATASET_PATH: str = "data/raw/Pune_Clinical_Risk_Synthetic_Dataset_20000.csv"
    DATA_DICTIONARY_PATH: str = "data/raw/Pune_Clinical_Risk_Data_Dictionary.csv"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
