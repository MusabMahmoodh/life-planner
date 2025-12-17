from pydantic_settings import BaseSettings
import os
class Settings(BaseSettings):
# Do NOT paste the key here. Use os.getenv
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    
    class Config:
        env_file = ".env"

settings = Settings()