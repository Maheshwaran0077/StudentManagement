"""
Recommendation Agent
Combines Pattern + Diagnosis + Prediction + Urgency to generate a suggested action.
Rule/template-based logic.
"""

from app.core.schemas import RecommendationInput, RecommendationResult

# ── Category → department mapping ────────────────────────────────────────────
DEPARTMENT_MAP: dict[str, str] = {
    "IT/Network": "IT / Network Infrastructure",
    "Hostel": "Hostel Management",
    "Canteen": "Canteen / Food Services",
    "Infrastructure": "Estate & Facilities Management",
    "Transport": "Transport Management",
    "Academic": "Academic Affairs",
    "Safety": "Campus Security",
    "Library": "Library Administration",
    "Medical": "Medical & Health Services",
    "Financial": "Finance & Accounts",
    "Administrative": "Administrative Office",
    "Harassment": "Student Welfare & Counselling",
    "Sports": "Sports & Recreation",
    "Other": "Administration",
}

# ── Category → action steps templates ────────────────────────────────────────
ACTION_STEPS: dict[str, list[str]] = {
    "IT/Network": [
        "Conduct a site survey of Wi-Fi access point coverage in affected areas",
        "Analyse bandwidth utilisation logs during peak hours",
        "Upgrade or add access points in high-demand locations",
        "Implement QoS policies to manage peak-hour congestion",
        "Schedule follow-up monitoring for 4 weeks post-intervention",
    ],
    "Hostel": [
        "Conduct a physical inspection of all reported hostel facilities",
        "Prioritise maintenance work orders by severity",
        "Increase housekeeping frequency in affected blocks",
        "Review warden response protocols and escalation timelines",
        "Establish a monthly feedback loop with hostel residents",
    ],
    "Canteen": [
        "Conduct an unannounced hygiene and quality inspection",
        "Review vendor contract and service-level agreements",
        "Collect structured feedback from students on menu preferences",
        "Introduce quality control checkpoints during food preparation",
        "Expand peak-hour staffing to reduce wait times",
    ],
    "Infrastructure": [
        "Carry out a structural and maintenance audit of affected areas",
        "Raise priority maintenance work orders immediately",
        "Allocate emergency repair budget if required",
        "Establish a preventive maintenance schedule",
        "Report completion status within 2 weeks",
    ],
    "Transport": [
        "Review route schedules against peak student demand patterns",
        "Inspect fleet maintenance records for affected vehicles",
        "Add additional trips or stops during high-demand windows",
        "Install a real-time bus tracking notification system",
    ],
    "Academic": [
        "Meet with department heads to discuss the identified concerns",
        "Review student feedback and examination result data",
        "Introduce supplementary sessions or office hours if needed",
        "Establish a student-faculty dialogue mechanism",
    ],
    "Safety": [
        "Audit CCTV coverage and security patrol schedules",
        "Increase security personnel during identified risk periods",
        "Review and update emergency response procedures",
        "Install additional lighting in poorly lit areas",
        "Conduct a safety awareness session for students",
    ],
    "Harassment": [
        "Activate the Internal Complaints Committee (ICC) review process",
        "Ensure anonymous reporting channels are functional and accessible",
        "Conduct mandatory anti-harassment awareness workshops",
        "Review current policy enforcement and grievance resolution timelines",
    ],
    "Library": [
        "Assess demand for specific resources and increase procurement",
        "Review and extend operating hours if feasible",
        "Improve digital catalogue and remote access systems",
    ],
    "Medical": [
        "Audit dispensary stock and replenishment processes",
        "Review staffing schedules for adequate coverage",
        "Improve appointment booking and follow-up systems",
    ],
    "Financial": [
        "Audit the fee processing and scholarship disbursement workflow",
        "Identify and resolve bottlenecks in the approval chain",
        "Communicate timelines clearly to affected students",
    ],
    "Administrative": [
        "Map current document processing workflows and identify delays",
        "Introduce digital processing for high-volume document types",
        "Set and communicate service-level turnaround times",
    ],
}

DEFAULT_STEPS = [
    "Investigate the root cause of the reported pattern",
    "Engage relevant stakeholders for immediate review",
    "Implement interim relief measures within one week",
    "Establish a monitoring mechanism for recurrence",
]

PRIORITY_MAP = {
    ("critical", "negative"): "critical",
    ("high", "negative"): "high",
    ("high", "neutral"): "high",
    ("medium", "negative"): "high",
    ("medium", "neutral"): "medium",
    ("low", "neutral"): "low",
    ("low", "positive"): "low",
}

IMPACT_MAP = {
    "critical": "high",
    "high": "high",
    "medium": "medium",
    "low": "low",
}


def recommend(data: RecommendationInput) -> RecommendationResult:
    steps = ACTION_STEPS.get(data.category, DEFAULT_STEPS)[:]

    # Enrich steps with diagnosis context
    if data.diagnosis and data.diagnosis.get("possible_causes"):
        causes = data.diagnosis["possible_causes"][:2]
        for cause in causes:
            steps.insert(1, f"Investigate specifically: {cause}")

    # Enrich with prediction trend
    if data.prediction and data.prediction.get("trend") in ("increasing", "emerging"):
        steps.append("Escalate urgency — complaint volume is trending upward.")
    elif data.prediction and data.prediction.get("trend") == "decreasing":
        steps.append("Monitor progress — trend is improving but intervention should continue.")

    # Priority
    sev = (data.severity or "medium").lower()
    sent = (data.sentiment or "neutral").lower()
    priority = PRIORITY_MAP.get((sev, sent), "medium")
    if data.grievance_count >= 100:
        priority = "critical" if priority != "critical" else priority

    target_dept = DEPARTMENT_MAP.get(data.category, "Administration")
    impact = IMPACT_MAP.get(priority, "medium")

    return RecommendationResult(
        pattern_id=data.pattern_id,
        suggested_steps=steps[:6],
        target_department=target_dept,
        estimated_impact=impact,
        priority=priority,
    )
