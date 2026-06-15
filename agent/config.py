from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    repo_path: str = "."
    aider_path: str = "aider"

    agent_host: str = "0.0.0.0"
    agent_port: int = 8000

    max_implement_retries: int = 3


settings = Settings()
