from fastapi import APIRouter, HTTPException
from app.core.schemas import ActionCoordinationInput, ActionCoordinationResult
from app.agents import action_coordination
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/actions/coordinate", response_model=ActionCoordinationResult)
async def coordinate_action(data: ActionCoordinationInput):
    """
    Generate a structured action title and full description from pattern +
    recommendation data. Used to create the action draft before admin approval.
    """
    try:
        result = action_coordination.coordinate(data)
        return result
    except Exception as e:
        logger.error(f"Action coordination error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
