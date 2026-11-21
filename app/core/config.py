from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "DevQuest Atelier"
    environment: Literal["development", "staging", "production", "test"] = "development"

    secret_key: str = (
        "dev-only-change-me-in-production-use-64-random-chars-minimum"  # noqa: S105
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120

    allowed_origins: str = (
        "http://127.0.0.1:8000,http://localhost:8000,http://127.0.0.1:5501,http://localhost:5501"
    )
    enable_docs: bool = True

    storage_backend: Literal["local", "firestore", "memory"] = "local"
    local_db_path: str = "data/local_db.json"
    firebase_credentials_path: str = "firebase-service-account.json"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        if len(value.strip()) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return value.strip()

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
