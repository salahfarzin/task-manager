from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # LLM — set either key; model string determines which provider is used.
    # OpenAI examples:    gpt-4o, gpt-4o-mini
    # Anthropic examples: anthropic/claude-sonnet-4-5, anthropic/claude-opus-4-5
    openai_api_key: str = ""
    openai_api_base: str = ""
    anthropic_api_key: str = ""
    llm_model: str = "openai/gpt-4o"

    repo_path: str = "."
    aider_path: str = "aider"

    agent_host: str = "0.0.0.0"
    agent_port: int = 8000

    max_implement_retries: int = 3


settings = Settings()
