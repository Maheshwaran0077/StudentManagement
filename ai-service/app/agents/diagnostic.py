"""
Diagnostic Agent
Rule-based analysis of a discovered pattern to identify possible causes.
Uses cautious evidence-based language — does not claim causation.
"""

from app.core.schemas import DiagnosisInput, DiagnosisResult

# ── Category-specific cause rules ────────────────────────────────────────────
CATEGORY_RULES: dict[str, list[str]] = {
    "IT/Network": [
        "Possible peak-hour capacity overload on access points",
        "Outdated or insufficient network infrastructure",
        "Bandwidth saturation during high-demand periods",
        "Configuration issues on routers or switches",
    ],
    "Hostel": [
        "Possible maintenance backlog in hostel facilities",
        "Warden or staff responsiveness may require review",
        "Infrastructure wear-and-tear in older hostel blocks",
        "Cleaning and upkeep scheduling may need adjustment",
    ],
    "Canteen": [
        "Food quality or hygiene standards may not be consistently met",
        "Supply chain or vendor management issues",
        "Peak-hour staffing insufficiency",
        "Menu variety or pricing concerns",
    ],
    "Infrastructure": [
        "Deferred maintenance on campus buildings",
        "Inspection and repair scheduling gaps",
        "Budget allocation may be insufficient for timely repairs",
    ],
    "Transport": [
        "Route scheduling may not align with peak demand",
        "Vehicle maintenance or fleet size constraints",
        "Driver availability or punctuality issues",
    ],
    "Academic": [
        "Faculty workload or availability constraints",
        "Curriculum or examination process inconsistencies",
        "Student feedback mechanisms may not be functioning optimally",
    ],
    "Safety": [
        "Security personnel coverage gaps",
        "CCTV or physical security infrastructure gaps",
        "Emergency response protocol may require review",
    ],
    "Library": [
        "Resource availability not meeting demand",
        "Operating hour constraints",
        "Catalogue or digital access limitations",
    ],
    "Medical": [
        "Dispensary staffing or availability issues",
        "Medicine stock management gaps",
        "Referral and follow-up process may need improvement",
    ],
    "Financial": [
        "Administrative processing delays in fee or scholarship workflows",
        "Communication gaps in financial aid eligibility",
    ],
    "Administrative": [
        "Document processing backlogs",
        "Digital workflow or automation gaps",
        "Staff responsiveness or training needs",
    ],
    "Harassment": [
        "Reporting and response mechanisms may not feel safe or accessible",
        "Anti-harassment policy enforcement requires review",
        "Awareness programmes may need strengthening",
    ],
}

DEFAULT_CAUSES = [
    "Systemic operational gap requiring root-cause investigation",
    "Resource or staffing constraint",
    "Communication or process inefficiency",
]

TIMING_CAUSES = {
    "evening": "Possible peak-hour demand surging beyond capacity during evening hours",
    "morning": "Morning rush may be exceeding service capacity",
    "weekend": "Weekend staffing may be insufficient relative to demand",
    "night": "Night-hour security or facility coverage may be inadequate",
}

KEYWORD_CAUSES = {
    "slow": "Service speed or response time is a likely contributing factor",
    "broken": "Equipment or facility in disrepair requiring maintenance",
    "dirty": "Cleanliness standards are not being consistently maintained",
    "unavailable": "Resource or service availability is constrained",
    "rude": "Staff interaction quality may require training intervention",
    "delayed": "Processing or response delays are a likely contributor",
    "expensive": "Cost or affordability barrier may be present",
}


def _confidence(grievance_count: int, keyword_hits: int, peak_found: bool) -> str:
    score = 0
    if grievance_count >= 50:
        score += 2
    elif grievance_count >= 20:
        score += 1
    if keyword_hits >= 3:
        score += 2
    elif keyword_hits >= 1:
        score += 1
    if peak_found:
        score += 1
    if score >= 4:
        return "high"
    if score >= 2:
        return "medium"
    return "low"


def diagnose(data: DiagnosisInput) -> DiagnosisResult:
    causes: list[str] = []

    # Base causes from category rules
    category_causes = CATEGORY_RULES.get(data.category, DEFAULT_CAUSES)
    causes.extend(category_causes[:2])

    # Timing-based cause from peak_period
    peak_found = False
    if data.peak_period:
        for time_kw, cause in TIMING_CAUSES.items():
            if time_kw in data.peak_period.lower():
                causes.append(cause)
                peak_found = True
                break

    # Keyword-based causes
    keyword_hits = 0
    keywords_lower = [k.lower() for k in data.keywords]
    for kw, cause in KEYWORD_CAUSES.items():
        if any(kw in k for k in keywords_lower):
            causes.append(cause)
            keyword_hits += 1

    # Sentiment-based cause
    if data.sentiment == "negative":
        causes.append("Accumulated negative sentiment suggests unresolved user frustration")

    # Recurrence boost
    if data.grievance_count >= 30:
        causes.append(
            f"The volume of {data.grievance_count} related grievances suggests a systemic rather than isolated issue"
        )

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_causes: list[str] = []
    for c in causes:
        if c not in seen:
            seen.add(c)
            unique_causes.append(c)

    evidence = (
        f"Pattern involves {data.grievance_count} grievances in the '{data.category}' category"
        + (f" at '{data.location}'" if data.location else "")
        + (f", peaking around {data.peak_period}" if data.peak_period else "")
        + f". Top keywords: {', '.join(data.keywords[:5])}."
        + f" Sentiment: {data.sentiment or 'unknown'}."
        + " Note: this diagnosis is indicative and should be verified with on-ground investigation."
    )

    confidence = _confidence(data.grievance_count, keyword_hits, peak_found)

    return DiagnosisResult(
        pattern_id=data.pattern_id,
        possible_causes=unique_causes[:6],
        evidence_summary=evidence,
        confidence_level=confidence,
    )
