from fastapi import APIRouter, HTTPException
from app.core.schemas import SemanticSearchInput, SemanticSearchResult
from app.agents import semantic_search
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/search/semantic", response_model=SemanticSearchResult)
async def semantic_pattern_search(data: SemanticSearchInput):
    """
    Convert a natural-language query to an embedding and rank pattern candidates
    by cosine similarity. Enables admins to search patterns semantically
    (e.g. 'recurring hostel problems during evening').
    """
    try:
        if not data.query or len(data.query.strip()) < 3:
            raise HTTPException(status_code=400, detail="Query must be at least 3 characters.")
        if not data.candidates:
            return SemanticSearchResult(query=data.query, results=[])
        result = semantic_search.search(data)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Semantic search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
