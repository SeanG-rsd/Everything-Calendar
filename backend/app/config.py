from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    PORT: int = 8000

    # Only used by the pytest suite, never by the running app.
    TEST_DATABASE_URL: str | None = None


settings = Settings()
