"""
Action Coordination Agent
Generates a structured action title and description from pattern + recommendation data.
Dynamic rule-based generation.
"""

from app.core.schemas import ActionCoordinationInput, ActionCoordinationResult

VERB_MAP: dict[str, str] = {
    "IT/Network": "Investigate and Resolve",
    "Hostel": "Inspect and Repair",
    "Canteen": "Audit and Improve",
    "Infrastructure": "Repair and Maintain",
    "Transport": "Review and Optimise",
    "Academic": "Review and Address",
    "Safety": "Audit and Strengthen",
    "Harassment": "Investigate and Enforce",
    "Library": "Assess and Upgrade",
    "Medical": "Review and Improve",
    "Financial": "Audit and Streamline",
    "Administrative": "Review and Digitise",
    "Sports": "Assess and Restore",
    "Other": "Investigate and Address",
}


def coordinate(data: ActionCoordinationInput) -> ActionCoordinationResult:
    verb = VERB_MAP.get(data.category, "Investigate and Address")
    location_part = f" at {data.location}" if data.location else ""

    title = f"{verb} {data.category} Issues{location_part}"

    # Build description
    rec = data.recommendation or {}
    dept = rec.get("target_department", "the relevant department")
    steps = rec.get("suggested_steps", [])
    priority = rec.get("priority", "medium")
    impact = rec.get("estimated_impact", "medium")

    steps_text = ""
    if steps:
        steps_text = "\n\nSuggested steps:\n" + "\n".join(f"  {i+1}. {s}" for i, s in enumerate(steps[:4]))

    description = (
        f"This action addresses a pattern of {data.grievance_count} {data.category} grievances"
        f"{location_part}. "
        f"Priority: {priority.upper()}. Estimated impact: {impact}. "
        f"Assigned to: {dept}."
        f"{steps_text}"
    )

    return ActionCoordinationResult(title=title, description=description)
