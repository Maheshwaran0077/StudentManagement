from fastapi import APIRouter, HTTPException
from app.core.schemas import PredictionInput, PredictionResult
from app.agents import prediction
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/predict", response_model=PredictionResult)
async def predict_trend(data: PredictionInput):
    """
    Statistical trend prediction using NumPy linear regression on weekly time-series data.
    Returns trend label, slope, R², growth rate, and a 4-week forecast with confidence interval.
    """
    try:
        result = prediction.predict(data)
        return result
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
