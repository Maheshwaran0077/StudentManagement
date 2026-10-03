from fastapi import APIRouter, HTTPException
from app.core.schemas import DiagnosisInput, DiagnosisResult
from app.agents import diagnostic
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/diagnose", response_model=DiagnosisResult)
async def diagnose_pattern(data: DiagnosisInput):
    """
    Rule-based diagnostic analysis of a discovered pattern.
    Returns possible causes and an evidence summary using cautious language.
    """
    try:
        result = diagnostic.diagnose(data)
        return result
    except Exception as e:
        logger.error(f"Diagnosis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
