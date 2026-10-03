from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


# ── Grievance Analysis ──────────────────────────────────────────────────────

class GrievanceInput(BaseModel):
    grievance_id: str
    title: str
    description: str
    category: str
    severity: str = "medium"
    location: Optional[str] = None


class GrievanceAnalysisResult(BaseModel):
    grievance_id: str
    preprocessed_text: str
    keywords: List[str]
    sentiment: str          # positive | negative | neutral
    sentiment_score: float
    is_safety_concern: bool
    is_recurrence: bool
    recurrence_signals: List[str]
    urgency_score: float    # 0–10
    urgency_level: str      # low | medium | high | critical
    embedding: List[float]  # 384-D


# ── Pattern Discovery ────────────────────────────────────────────────────────

class GrievanceForClustering(BaseModel):
    id: str
    embedding: List[float]
    category: str
    location: Optional[str] = None
    severity: Optional[str] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    keywords: List[str] = []
    stakeholder_group: Optional[str] = None
    created_at: Optional[Any] = None


class PatternDiscoveryInput(BaseModel):
    grievances: List[GrievanceForClustering]


class WeeklyTrendPoint(BaseModel):
    week: str
    count: int


class DiscoveredPattern(BaseModel):
    cluster_id: int
    method: str
    title: str
    description: str
    category: str
    sub_category: Optional[str] = None
    location: Optional[str] = None
    severity: Optional[str] = None
    sentiment: Optional[str] = None
    avg_sentiment_score: Optional[float] = None
    keywords: List[str]
    stakeholder_group: Optional[str] = None
    grievance_ids: List[str]
    first_occurrence: Optional[str] = None
    last_occurrence: Optional[str] = None
    peak_period: Optional[str] = None
    weekly_trend: List[WeeklyTrendPoint] = []
    silhouette_score: Optional[float] = None
    centroid_embedding: Optional[List[float]] = None


class PatternDiscoveryResult(BaseModel):
    patterns: List[DiscoveredPattern]
    total_grievances: int
    noise_count: int
    method_used: str


# ── Diagnosis ────────────────────────────────────────────────────────────────

class DiagnosisInput(BaseModel):
    pattern_id: str
    category: str
    location: Optional[str] = None
    grievance_count: int
    keywords: List[str]
    weekly_trend: List[WeeklyTrendPoint] = []
    sentiment: Optional[str] = None
    severity: Optional[str] = None
    peak_period: Optional[str] = None


class DiagnosisResult(BaseModel):
    pattern_id: str
    possible_causes: List[str]
    evidence_summary: str
    confidence_level: str   # low | medium | high


# ── Prediction ───────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    pattern_id: str
    weekly_trend: List[WeeklyTrendPoint]
    category: Optional[str] = None


class ForecastPoint(BaseModel):
    week: str
    predicted: float
    lower: float
    upper: float


class PredictionResult(BaseModel):
    pattern_id: str
    trend: str              # increasing | decreasing | stable | emerging
    slope: float
    r_squared: float
    growth_rate: float
    forecast: List[ForecastPoint]


# ── Recommendation ───────────────────────────────────────────────────────────

class RecommendationInput(BaseModel):
    pattern_id: str
    category: str
    location: Optional[str] = None
    grievance_count: int
    severity: Optional[str] = None
    sentiment: Optional[str] = None
    keywords: List[str] = []
    diagnosis: Optional[Dict[str, Any]] = None
    prediction: Optional[Dict[str, Any]] = None


class RecommendationResult(BaseModel):
    pattern_id: str
    suggested_steps: List[str]
    target_department: str
    estimated_impact: str
    priority: str


# ── Action Coordination ──────────────────────────────────────────────────────

class ActionCoordinationInput(RecommendationInput):
    recommendation: Optional[Dict[str, Any]] = None


class ActionCoordinationResult(BaseModel):
    title: str
    description: str


# ── Outcome Measurement ──────────────────────────────────────────────────────

class OutcomeMeasurementInput(BaseModel):
    action_id: str
    pattern_id: Optional[str] = None
    action_completed_at: Optional[Any] = None
    category: Optional[str] = None
    location: Optional[str] = None
    grievance_ids: List[str] = []


class MetricsSnapshot(BaseModel):
    grievance_count: int
    avg_severity_score: float
    avg_sentiment_score: float
    weekly_frequency: float
    period: str


class OutcomeMeasurementResult(BaseModel):
    action_id: str
    before: MetricsSnapshot
    after: MetricsSnapshot
    improvement_rate: float
    sentiment_improvement: float
    effectiveness_score: float
    verdict: str
    recurrence_detected: bool
    recurrence_score: float
    recurrence_grievance_ids: List[str] = []


# ── Semantic Search ──────────────────────────────────────────────────────────

class SearchCandidate(BaseModel):
    id: str
    text: str
    embedding: Optional[List[float]] = None


class SemanticSearchInput(BaseModel):
    query: str
    candidates: List[SearchCandidate]


class SearchResultItem(BaseModel):
    id: str
    score: float
    rank: int


class SemanticSearchResult(BaseModel):
    query: str
    results: List[SearchResultItem]
