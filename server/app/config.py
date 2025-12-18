from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-default-supabase-url.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "your-default-anon-key")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "your-default-service-key")

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "your-default-openai-key")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "your-default-anthropic-key")

    # App
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()