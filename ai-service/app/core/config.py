from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    backend_url: str = "http://localhost:5000"
    port: int = 8000
    model_name: str = "all-MiniLM-L6-v2"
    hdbscan_min_cluster_size: int = 5
    hdbscan_min_samples: int = 3
    similarity_threshold: float = 0.75
    recurrence_threshold: float = 0.80

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
