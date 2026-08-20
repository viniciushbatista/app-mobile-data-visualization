from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # DATABASE_URL completa do Neon/Render — tem prioridade sobre campos separados
    database_url_env: Optional[str] = Field(None, alias="DATABASE_URL")

    # Campos separados para desenvolvimento local
    db_user: str = "postgres"
    db_password: str = ""
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "biogas_pb"

    @property
    def database_url(self) -> str:
        if self.database_url_env:
            # Neon fornece postgres:// ou postgresql:// — SQLAlchemy precisa de postgresql+psycopg2://
            url = self.database_url_env
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif url.startswith("postgresql://") and "+psycopg2" not in url:
                url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
            return url
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def excel_path(self) -> Path:
        return DATA_DIR / "data_munic_meso.xlsx"


@lru_cache
def get_settings() -> Settings:
    return Settings()
