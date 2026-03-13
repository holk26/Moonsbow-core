from functools import lru_cache
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "Moonsbow Core"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_PORT: int = 8000

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # Comma-separated list of allowed CORS origins; defaults to localhost for development
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    DATABASE_URL: str = "postgresql+asyncpg://moonsbow:moonsbow@localhost:5432/moonsbow"
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    @model_validator(mode="after")
    def validate_production_secret(self) -> "Settings":
        if self.APP_ENV == "production" and len(self.SECRET_KEY) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long in production")
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
