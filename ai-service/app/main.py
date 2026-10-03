from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import get_settings
from app.routers import analyze, patterns, diagnose, predict, recommend, actions, outcomes, search

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="Campus Guardian 360 — AI Service",
    description="NLP/ML pipeline: grievance analysis, pattern discovery, diagnosis, prediction, recommendation, and outcome monitoring.",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.backend_url, "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(analyze.router,   prefix="/api", tags=["Feedback Intelligence"])
app.include_router(patterns.router,  prefix="/api", tags=["Pattern Discovery"])
app.include_router(diagnose.router,  prefix="/api", tags=["Diagnosis"])
app.include_router(predict.router,   prefix="/api", tags=["Prediction"])
app.include_router(recommend.router, prefix="/api", tags=["Recommendation"])
app.include_router(actions.router,   prefix="/api", tags=["Action Coordination"])
app.include_router(outcomes.router,  prefix="/api", tags=["Outcome & Recurrence"])
app.include_router(search.router,    prefix="/api", tags=["Semantic Search"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "Campus Guardian 360 AI Service"}


@app.on_event("startup")
async def startup_event():
    logger.info("AI Service starting up…")
    # Warm up the embedding model
    from app.core.model_manager import get_model
    get_model()
    logger.info("Embedding model ready.")
