from fastapi import APIRouter, HTTPException
from app.core.schemas import PatternDiscoveryInput, PatternDiscoveryResult
from app.agents import pattern_discovery
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/patterns/discover", response_model=PatternDiscoveryResult)
async def discover_patterns(payload: PatternDiscoveryInput):
    """
    Run HDBSCAN (with K-Means fallback) on a batch of grievance embeddings
    to discover recurring complaint patterns.
    """
    try:
        if len(payload.grievances) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 grievances with embeddings are required for pattern discovery."
            )
        result = pattern_discovery.discover(payload)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pattern discovery error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
