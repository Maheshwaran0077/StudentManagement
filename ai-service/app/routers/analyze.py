from fastapi import APIRouter, HTTPException
from app.core.schemas import GrievanceInput, GrievanceAnalysisResult
from app.agents import feedback_intelligence
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=GrievanceAnalysisResult)
async def analyze_grievance(grievance: GrievanceInput):
    """
    Full AI pipeline for a single grievance:
    preprocessing → keywords → sentiment → safety → recurrence → urgency → embedding
    """
    try:
        result = feedback_intelligence.analyze(grievance)
        return result
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
