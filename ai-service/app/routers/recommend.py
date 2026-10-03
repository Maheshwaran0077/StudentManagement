from fastapi import APIRouter, HTTPException
from app.core.schemas import RecommendationInput, RecommendationResult
from app.agents import recommendation
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/recommend", response_model=RecommendationResult)
async def generate_recommendation(data: RecommendationInput):
    """
    Generate a recommended action based on pattern characteristics,
    diagnosis context, and prediction trend.
    Returns suggested steps, target department, priority, and estimated impact.
    """
    try:
        result = recommendation.recommend(data)
        return result
    except Exception as e:
        logger.error(f"Recommendation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
