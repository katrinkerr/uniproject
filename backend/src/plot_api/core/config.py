from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Values can be overridden using environment variables or a .env file."""

    app_name: str = "PLOT API"
    app_version: str = "0.1.0"
    frontend_origins: str = (
        "http://localhost:4200,http://127.0.0.1:4200"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> list[str]:
        """Turn a comma-separated setting into a list of frontend URLs."""
        return [
            origin.strip()
            for origin in self.frontend_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
