from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # GitHub
    github_client_id: str = ""
    github_client_secret: str = ""

    # JWT
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 60

    # Encryption
    token_encryption_key: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://zappr:zappr@localhost:5432/zappr"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Patch limits
    patch_max_files: int = 20
    patch_max_lines: int = 2000

    # CORS
    cors_origins: str = "*"

    # OAuth redirect (for mobile; register in GitHub OAuth app)
    oauth_redirect_uri: str = "zappr://auth/callback"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
