"""
Singleton manager for the SentenceTransformer model.
Loads once on first access to avoid repeated disk I/O.
"""
from sentence_transformers import SentenceTransformer
from .config import get_settings
import logging

logger = logging.getLogger(__name__)

_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        settings = get_settings()
        logger.info(f"Loading SentenceTransformer model: {settings.model_name}")
        _model = SentenceTransformer(settings.model_name)
        logger.info("Model loaded successfully.")
    return _model


def encode(texts: list[str]) -> list[list[float]]:
    """Encode a list of strings → list of 384-D float vectors."""
    model = get_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()


def encode_single(text: str) -> list[float]:
    return encode([text])[0]
