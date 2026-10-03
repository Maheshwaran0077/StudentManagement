"""
Pattern Discovery Agent
Primary: HDBSCAN clustering on 384-D embeddings
Fallback: K-Means if HDBSCAN quality is poor (silhouette < 0.2)
"""

import logging
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sklearn.metrics import silhouette_score
from sklearn.cluster import KMeans

try:
    import hdbscan
    HDBSCAN_AVAILABLE = True
except ImportError:
    HDBSCAN_AVAILABLE = False

from app.core.config import get_settings
from app.core.schemas import (
    PatternDiscoveryInput, PatternDiscoveryResult, DiscoveredPattern, WeeklyTrendPoint,
)

logger = logging.getLogger(__name__)
settings = get_settings()

SEVERITY_ORDER = {"low": 1, "medium": 2, "high": 3, "critical": 4}


def _majority(values: list) -> Any:
    if not values:
        return None
    return Counter(values).most_common(1)[0][0]


def _week_label(dt_str: Any) -> str:
    try:
        if isinstance(dt_str, str):
            dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        elif isinstance(dt_str, datetime):
            dt = dt_str
        else:
            dt = datetime.now(timezone.utc)
        iso = dt.isocalendar()
        return f"{iso[0]}-W{iso[1]:02d}"
    except Exception:
        return "unknown"


def _build_weekly_trend(dates: list) -> list[WeeklyTrendPoint]:
    counter: Counter = Counter()
    for d in dates:
        counter[_week_label(d)] += 1
    return [WeeklyTrendPoint(week=w, count=c) for w, c in sorted(counter.items())]


def _peak_period(weekly_trend: list[WeeklyTrendPoint]) -> str | None:
    if not weekly_trend:
        return None
    peak = max(weekly_trend, key=lambda x: x.count)
    return peak.week


def _build_pattern(
    cluster_id: int,
    method: str,
    members: list,
    embeddings: np.ndarray,
    silhouette: float | None,
) -> DiscoveredPattern:
    categories = [g.category for g in members]
    locations = [g.location for g in members if g.location]
    sentiments = [g.sentiment for g in members if g.sentiment]
    severities = [g.severity for g in members if g.severity]
    all_keywords: list[str] = []
    for g in members:
        all_keywords.extend(g.keywords)
    top_keywords = [kw for kw, _ in Counter(all_keywords).most_common(10)]

    dates = [g.created_at for g in members if g.created_at]
    weekly_trend = _build_weekly_trend(dates)

    # Centroid embedding
    centroid = embeddings.mean(axis=0).tolist()

    dominant_category = _majority(categories)
    dominant_location = _majority(locations) if locations else None
    dominant_sentiment = _majority(sentiments) if sentiments else None

    # Dominant severity (highest)
    if severities:
        dominant_severity = max(severities, key=lambda s: SEVERITY_ORDER.get(s, 0))
    else:
        dominant_severity = None

    avg_sentiment = (
        float(np.mean([g.sentiment_score for g in members if g.sentiment_score is not None]))
        if any(g.sentiment_score is not None for g in members) else None
    )

    date_strs = sorted([str(d) for d in dates]) if dates else []
    title = f"{dominant_category} issues" + (f" at {dominant_location}" if dominant_location else "")

    return DiscoveredPattern(
        cluster_id=cluster_id,
        method=method,
        title=title,
        description=f"Cluster of {len(members)} {dominant_category} grievances"
                    + (f" reported at {dominant_location}." if dominant_location else "."),
        category=dominant_category,
        location=dominant_location,
        severity=dominant_severity,
        sentiment=dominant_sentiment,
        avg_sentiment_score=round(avg_sentiment, 4) if avg_sentiment is not None else None,
        keywords=top_keywords,
        stakeholder_group=_majority([g.stakeholder_group for g in members if g.stakeholder_group]),
        grievance_ids=[g.id for g in members],
        first_occurrence=date_strs[0] if date_strs else None,
        last_occurrence=date_strs[-1] if date_strs else None,
        peak_period=_peak_period(weekly_trend),
        weekly_trend=weekly_trend,
        silhouette_score=round(silhouette, 4) if silhouette is not None else None,
        centroid_embedding=centroid,
    )


def discover(payload: PatternDiscoveryInput) -> PatternDiscoveryResult:
    grievances = payload.grievances
    if len(grievances) < 2:
        return PatternDiscoveryResult(patterns=[], total_grievances=len(grievances), noise_count=0, method_used="none")

    X = np.array([g.embedding for g in grievances], dtype=np.float32)

    labels: np.ndarray
    method_used = "HDBSCAN"
    sil_score: float | None = None

    # ── Primary: HDBSCAN ────────────────────────────────────────────────────
    if HDBSCAN_AVAILABLE:
        clusterer = hdbscan.HDBSCAN(
            min_cluster_size=settings.hdbscan_min_cluster_size,
            min_samples=settings.hdbscan_min_samples,
            metric="euclidean",
        )
        labels = clusterer.fit_predict(X)
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        logger.info(f"HDBSCAN found {n_clusters} clusters, noise={np.sum(labels == -1)}")

        if n_clusters >= 2:
            try:
                valid = labels != -1
                if valid.sum() > n_clusters:
                    sil_score = silhouette_score(X[valid], labels[valid])
            except Exception:
                sil_score = None
    else:
        labels = np.full(len(grievances), -1, dtype=int)
        n_clusters = 0

    # ── Fallback: K-Means ────────────────────────────────────────────────────
    use_kmeans = (not HDBSCAN_AVAILABLE) or (sil_score is not None and sil_score < 0.2) or (n_clusters < 2)
    if use_kmeans:
        method_used = "KMeans"
        best_k, best_sil, best_labels = 2, -1.0, None
        max_k = min(10, len(grievances) // 2)
        for k in range(2, max_k + 1):
            km = KMeans(n_clusters=k, random_state=42, n_init=10)
            lbl = km.fit_predict(X)
            try:
                s = silhouette_score(X, lbl)
            except Exception:
                s = -1.0
            if s > best_sil:
                best_sil, best_k, best_labels = s, k, lbl
        labels = best_labels if best_labels is not None else np.zeros(len(grievances), dtype=int)
        sil_score = best_sil
        logger.info(f"KMeans selected k={best_k}, silhouette={best_sil:.3f}")

    # ── Build patterns from clusters ────────────────────────────────────────
    clusters: dict[int, list] = defaultdict(list)
    cluster_embeddings: dict[int, list] = defaultdict(list)
    noise_count = 0

    for i, lbl in enumerate(labels):
        if lbl == -1:
            noise_count += 1
            continue
        clusters[lbl].append(grievances[i])
        cluster_embeddings[lbl].append(X[i])

    patterns: list[DiscoveredPattern] = []
    for cluster_id, members in clusters.items():
        emb_matrix = np.array(cluster_embeddings[cluster_id])
        pattern = _build_pattern(cluster_id, method_used, members, emb_matrix, sil_score)
        patterns.append(pattern)

    # Sort by size descending
    patterns.sort(key=lambda p: len(p.grievance_ids), reverse=True)

    return PatternDiscoveryResult(
        patterns=patterns,
        total_grievances=len(grievances),
        noise_count=noise_count,
        method_used=method_used,
    )
