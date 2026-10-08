from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    app_name: str = "TailorTrack API"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/tailortrack"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24 * 7

    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    otp_dev_mode: bool = True
    otp_ttl_seconds: int = 300
    otp_max_attempts: int = 5

    admin_email: str = "admin@tailortrack.local"
    admin_password: str = "admin12345"

    commission_percent: float = 15.0
    visit_fee: int = 0

    upload_dir: Path = BASE_DIR / "uploads"
    max_upload_mb: int = 5

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [o.strip() for o in value.split(",") if o.strip()]
        return value

    @field_validator("upload_dir", mode="after")
    @classmethod
    def absolute_upload_dir(cls, value: Path) -> Path:
        return value if value.is_absolute() else BASE_DIR / value


@lru_cache
def get_settings() -> Settings:
    return Settings()
