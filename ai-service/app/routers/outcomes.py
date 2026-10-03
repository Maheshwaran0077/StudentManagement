from fastapi import APIRouter, HTTPException
from app.core.schemas import OutcomeMeasurementInput, OutcomeMeasurementResult
from app.agents import outcome_recurrence
from app.core.config import get_settings
import logging
from pymongo import MongoClient
from bson import ObjectId

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()

# Lazy synchronous MongoDB client — only used here to fetch grievance details
_client: MongoClient | None = None


def _get_db():
    global _client
    if _client is None:
        _client = MongoClient(settings.mongodb_uri)
    return _client["campus_guardian_360"]


@router.post("/outcomes/measure", response_model=OutcomeMeasurementResult)
async def measure_outcome(data: OutcomeMeasurementInput):
    """
    Measures the effectiveness of a completed action by comparing before/after
    grievance metrics and detecting recurrence via cosine similarity.
    """
    try:
        db_grievances: list[dict] = []

        if data.grievance_ids:
            db = _get_db()
            object_ids = []
            for gid in data.grievance_ids:
                try:
                    object_ids.append(ObjectId(gid))
                except Exception:
                    pass

            if object_ids:
                cursor = db["grievances"].find(
                    {"_id": {"$in": object_ids}},
                    {
                        "category": 1, "location": 1, "severity": 1,
                        "aiAnalysis.sentimentScore": 1,
                        "aiAnalysis.embedding": 1,
                        "title": 1, "createdAt": 1,
                    }
                )
                for doc in cursor:
                    db_grievances.append({
                        "_id": str(doc["_id"]),
                        "category": doc.get("category"),
                        "location": doc.get("location"),
                        "severity": doc.get("severity"),
                        "title": doc.get("title"),
                        "sentiment_score": doc.get("aiAnalysis", {}).get("sentimentScore"),
                        "embedding": doc.get("aiAnalysis", {}).get("embedding"),
                        "created_at": doc.get("createdAt"),
                    })

        result = outcome_recurrence.measure(data, db_grievances)
        return result

    except Exception as e:
        logger.error(f"Outcome measurement error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
