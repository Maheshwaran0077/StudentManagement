"""
Feedback Intelligence Agent
Responsibilities:
  - Preprocessing (lowercase, tokenize, stopword removal, stemming, punctuation removal)
  - Topic / Subtopic detection via keyword rules
  - Keyword extraction (TF-IDF style)
  - Sentiment analysis via VADER
  - Safety detection
  - Recurrence signal detection
  - Urgency scoring
  - Sentence embedding via all-MiniLM-L6-v2
"""

import re
import string
import logging
from collections import Counter

import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.core.model_manager import encode_single
from app.core.schemas import GrievanceInput, GrievanceAnalysisResult

logger = logging.getLogger(__name__)

# Download required NLTK data on first import
for pkg in ["punkt", "stopwords", "punkt_tab"]:
    try:
        nltk.download(pkg, quiet=True)
    except Exception:
        pass

_stemmer = PorterStemmer()
_stop_words = set(stopwords.words("english"))
_vader = SentimentIntensityAnalyzer()

# ── Safety keywords ──────────────────────────────────────────────────────────
SAFETY_KEYWORDS = {
    "harassment", "assault", "threat", "abuse", "violence", "unsafe",
    "danger", "attack", "molest", "stalk", "bully", "discriminat",
    "ragging", "eve teas", "sexual", "weapon",
}

# ── Recurrence signals ───────────────────────────────────────────────────────
RECURRENCE_SIGNALS = [
    "again", "still", "repeatedly", "second time", "third time",
    "multiple times", "once more", "keep happening", "not resolved",
    "unresolved", "persists", "continues", "ongoing", "chronic",
    "same problem", "same issue", "as before",
]

# ── Category → department keyword map ────────────────────────────────────────
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Hostel": ["hostel", "room", "dormitory", "warden", "mess", "dorm", "bed", "accommodation"],
    "IT/Network": ["wifi", "internet", "network", "lab", "computer", "server", "bandwidth", "connectivity"],
    "Canteen": ["canteen", "food", "mess", "cafeteria", "meal", "lunch", "dinner", "breakfast", "hygiene"],
    "Infrastructure": ["building", "classroom", "infrastructure", "facility", "toilet", "washroom", "lift", "stairs"],
    "Transport": ["bus", "transport", "shuttle", "vehicle", "driver", "route", "commute"],
    "Academic": ["faculty", "teacher", "professor", "exam", "result", "syllabus", "attendance", "grade", "marks"],
    "Safety": ["fire", "security", "guard", "cctv", "lock", "emergency", "accident", "first aid"],
    "Library": ["library", "book", "journal", "reference", "catalogue", "reading room"],
    "Medical": ["medical", "hospital", "dispensary", "doctor", "nurse", "medicine", "health"],
    "Financial": ["fee", "scholarship", "refund", "payment", "stipend", "fine", "dues"],
    "Administrative": ["admin", "registration", "certificate", "document", "id card", "noc"],
    "Sports": ["sports", "ground", "gym", "equipment", "court", "field", "playground"],
    "Harassment": ["harassment", "ragging", "bully", "discriminat", "abuse", "eve teas"],
}

# ── Severity → urgency base score ────────────────────────────────────────────
SEVERITY_SCORE = {"low": 1, "medium": 3, "high": 6, "critical": 9}


def _preprocess(text: str) -> tuple[str, list[str]]:
    """Return (clean_text, token_list)."""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = word_tokenize(text)
    tokens = [_stemmer.stem(t) for t in tokens if t not in _stop_words and len(t) > 2]
    return " ".join(tokens), tokens


def _extract_keywords(title: str, description: str, top_n: int = 10) -> list[str]:
    combined = f"{title} {description}".lower()
    combined = combined.translate(str.maketrans("", "", string.punctuation))
    words = word_tokenize(combined)
    words = [w for w in words if w not in _stop_words and len(w) > 3]
    freq = Counter(words)
    return [w for w, _ in freq.most_common(top_n)]


def _detect_safety(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in SAFETY_KEYWORDS)


def _detect_recurrence(text: str) -> tuple[bool, list[str]]:
    lower = text.lower()
    found = [sig for sig in RECURRENCE_SIGNALS if sig in lower]
    return bool(found), found


def _compute_urgency(
    severity: str,
    sentiment_score: float,
    is_safety: bool,
    is_recurrence: bool,
    category: str,
) -> tuple[float, str]:
    base = SEVERITY_SCORE.get(severity.lower(), 3)
    # Negative sentiment boosts urgency
    sentiment_boost = abs(sentiment_score) * 2 if sentiment_score < 0 else 0
    safety_boost = 3.0 if is_safety else 0.0
    recurrence_boost = 1.5 if is_recurrence else 0.0
    category_boost = 1.0 if category in ("Harassment", "Safety", "Medical") else 0.0

    raw = base + sentiment_boost + safety_boost + recurrence_boost + category_boost
    score = min(round(raw, 2), 10.0)

    if score >= 8:
        level = "critical"
    elif score >= 6:
        level = "high"
    elif score >= 3:
        level = "medium"
    else:
        level = "low"
    return score, level


def analyze(grievance: GrievanceInput) -> GrievanceAnalysisResult:
    full_text = f"{grievance.title} {grievance.description}"

    # Step 1 — Preprocess
    preprocessed_text, _ = _preprocess(full_text)

    # Step 2/3 — Keywords
    keywords = _extract_keywords(grievance.title, grievance.description)

    # Step 4 — Sentiment (VADER on raw text)
    vs = _vader.polarity_scores(full_text)
    compound = round(vs["compound"], 4)
    if compound >= 0.05:
        sentiment = "positive"
    elif compound <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Step 5 — Safety
    is_safety = _detect_safety(full_text) or grievance.category in ("Safety", "Harassment")

    # Step 6 — Recurrence
    is_recurrence, recurrence_signals = _detect_recurrence(full_text)

    # Step 7 — Urgency
    urgency_score, urgency_level = _compute_urgency(
        grievance.severity, compound, is_safety, is_recurrence, grievance.category
    )

    # Step 8 — Embedding
    embed_text = f"{grievance.title}. {grievance.description}. Category: {grievance.category}."
    if grievance.location:
        embed_text += f" Location: {grievance.location}."
    embedding = encode_single(embed_text)

    return GrievanceAnalysisResult(
        grievance_id=grievance.grievance_id,
        preprocessed_text=preprocessed_text,
        keywords=keywords,
        sentiment=sentiment,
        sentiment_score=compound,
        is_safety_concern=is_safety,
        is_recurrence=is_recurrence,
        recurrence_signals=recurrence_signals,
        urgency_score=urgency_score,
        urgency_level=urgency_level,
        embedding=embedding,
    )
