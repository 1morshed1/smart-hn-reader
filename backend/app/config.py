from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db: str = "hn_reader"
    gemini_api_key: str
    gemini_model: str = "gemini-2.0-flash"
    backend_port: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()
