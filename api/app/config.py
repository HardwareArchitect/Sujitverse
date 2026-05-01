from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    secret_key: str
    db_path: str = "/srv/sujitverse/db/sujitverse.db"
    files_root: str = "/srv/sujitverse/files"
    thumbnails_root: str = "/srv/sujitverse/thumbnails"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    max_users: int = 15
    invite_expire_days: int = 7

    model_config = SettingsConfigDict(
        env_file="/srv/sujitverse/api/.env",
        case_sensitive=False,
    )


settings = Settings()
