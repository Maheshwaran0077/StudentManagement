"""
Outcome & Recurrence Agent
- Compares before/after metrics for a completed action
- Detects recurrence using cosine similarity + category + location matching
"""

import math
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import get_settings
from app.core.model_manager import encode_single
from app.core.schemas import (
    OutcomeMeasurementInput, OutcomeMeasurementResult, MetricsSnapshot,
)

settings = get_settings()

SEVERITY_SCORE = {"low": 1, "medium": 2, "high": 3, "critical": 4}


def _safe_mean(values: list) -> float:
    return float(np.mean(values)) if values else 0.0


def _improvement_rate(before: float, after: float) -> float:
    if before == 0:
        return 0.0
    return round(((before - after) / before) * 100, 2)


def _verdict(improvement_rate: float, recurrence: bool) -> str:
    if recurrence:
        return "partially_effective"
    if improvement_rate >= 50:
        return "effective"
    if improvement_rate >= 20:
        return "partially_effective"
    if improvement_rate < 0:
        return "ineffective"
    return "partially_effective"


def _effectiveness_score(improvement_rate: float, sentiment_improvement: float) -> float:
    score = (improvement_rate * 0.7) + (sentiment_improvement * 30)
    return round(min(max(score, 0), 100), 2)


def measure(data: OutcomeMeasurementInput, db_grievances: list[dict] | None = None) -> OutcomeMeasurementResult:
    """
    data.grievance_ids — original grievances linked to the pattern/action.
    db_grievances — list of grievance dicts fetched from MongoDB (passed from router).
    Each dict should have: category, location, severity, sentiment_score, created_at, embedding (optional).
    """
    grievances = db_grievances or []

    completed_at = data.action_completed_at
    if isinstance(completed_at, str):
        try:
            completed_at = datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
        except Exception:
            completed_at = datetime.now(timezone.utc)
    elif not isinstance(completed_at, datetime):
        completed_at = datetime.now(timezone.utc)

    before_grievances = [g for g in grievances if _parse_date(g.get("created_at")) < completed_at]
    after_grievances = [g for g in grievances if _parse_date(g.get("created_at")) >= completed_at]

    # ── Before metrics ──────────────────────────────────────────────────────
    before_severities = [SEVERITY_SCORE.get(g.get("severity", "medium"), 2) for g in before_grievances]
    before_sentiments = [g.get("sentiment_score", 0) for g in before_grievances if g.get("sentiment_score") is not None]
    before_snap = MetricsSnapshot(
        grievance_count=len(before_grievances),
        avg_severity_score=round(_safe_mean(before_severities), 2),
        avg_sentiment_score=round(_safe_mean(before_sentiments), 4),
        weekly_frequency=round(len(before_grievances) / max(_weeks_span(before_grievances), 1), 2),
        period="before_action",
    )

    # ── After metrics ───────────────────────────────────────────────────────
    after_severities = [SEVERITY_SCORE.get(g.get("severity", "medium"), 2) for g in after_grievances]
    after_sentiments = [g.get("sentiment_score", 0) for g in after_grievances if g.get("sentiment_score") is not None]
    after_snap = MetricsSnapshot(
        grievance_count=len(after_grievances),
        avg_severity_score=round(_safe_mean(after_severities), 2),
        avg_sentiment_score=round(_safe_mean(after_sentiments), 4),
        weekly_frequency=round(len(after_grievances) / max(_weeks_span(after_grievances), 1), 2),
        period="after_action",
    )

    improvement_rate = _improvement_rate(before_snap.grievance_count, after_snap.grievance_count)
    sentiment_improvement = round(after_snap.avg_sentiment_score - before_snap.avg_sentiment_score, 4)

    # ── Recurrence detection ────────────────────────────────────────────────
    recurrence_detected = False
    recurrence_score = 0.0
    recurrence_ids: list[str] = []

    if after_grievances and before_grievances:
        # Encode a "pattern summary" from before-grievances
        pattern_texts = [
            f"{g.get('category', '')} {g.get('location', '')} {g.get('title', '')}"
            for g in before_grievances[:20]
        ]
        pattern_embedding = np.array(encode_single(" ".join(pattern_texts))).reshape(1, -1)

        for g in after_grievances:
            g_text = f"{g.get('category', '')} {g.get('location', '')} {g.get('title', '')}"
            g_emb = np.array(encode_single(g_text)).reshape(1, -1)
            sim = float(cosine_similarity(pattern_embedding, g_emb)[0][0])

            category_match = g.get("category") == data.category
            location_match = (not data.location) or (g.get("location") == data.location)

            if sim >= settings.recurrence_threshold and category_match and location_match:
                recurrence_ids.append(str(g.get("_id", "")))
                recurrence_score = max(recurrence_score, sim)

        recurrence_detected = len(recurrence_ids) > 0

    effectiveness = _effectiveness_score(improvement_rate, sentiment_improvement)
    verdict = _verdict(improvement_rate, recurrence_detected)

    return OutcomeMeasurementResult(
        action_id=data.action_id,
        before=before_snap,
        after=after_snap,
        improvement_rate=improvement_rate,
        sentiment_improvement=sentiment_improvement,
        effectiveness_score=effectiveness,
        verdict=verdict,
        recurrence_detected=recurrence_detected,
        recurrence_score=round(recurrence_score, 4),
        recurrence_grievance_ids=recurrence_ids,
    )


def _parse_date(value: Any) -> datetime:
    try:
        if isinstance(value, datetime):
            return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
        if isinstance(value, str):
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        pass
    return datetime.min.replace(tzinfo=timezone.utc)


def _weeks_span(grievances: list[dict]) -> int:
    if not grievances:
        return 1
    dates = [_parse_date(g.get("created_at")) for g in grievances]
    dates = [d for d in dates if d != datetime.min.replace(tzinfo=timezone.utc)]
    if len(dates) < 2:
        return 1
    span = (max(dates) - min(dates)).days
    return max(1, math.ceil(span / 7))
