"""
backend.app.core.state_names - Canonical State & Union Territory Normalization.
Ensures 100% geographic consistency between the FastAPI backend and the frontend interactive India map.
"""

from typing import Dict

# Map common variations and legacy names to canonical display names matching the frontend TopoJSON
STATE_SYNONYMS: Dict[str, str] = {
    "jammu & kashmir": "Jammu and Kashmir",
    "jammu and kashmir": "Jammu and Kashmir",
    "j&k": "Jammu and Kashmir",
    "odisha": "Odisha",
    "orissa": "Odisha",
    "uttarakhand": "Uttarakhand",
    "uttaranchal": "Uttarakhand",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry",
    "telangana": "Telangana",
    "telengana": "Telangana",
    "delhi": "Delhi",
    "nct of delhi": "Delhi",
    "national capital territory of delhi": "Delhi",
    "andaman & nicobar islands": "Andaman and Nicobar Islands",
    "andaman and nicobar islands": "Andaman and Nicobar Islands",
    "andaman and nicobar": "Andaman and Nicobar Islands",
    "dadra and nagar haveli and daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
    "dadra & nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
    "daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
    "ladakh": "Ladakh",
    "chandigarh": "Chandigarh",
    "lakshadweep": "Lakshadweep",
    "multi state": "Multi-State",
    "multi-state": "Multi-State",
    "pan india": "Pan India",
}


def normalize_state_name(state: str | None) -> str:
    """Normalize raw state string into canonical title-cased state name."""
    if not state:
        return ""
    s = state.strip().lower()

    if s in STATE_SYNONYMS:
        return STATE_SYNONYMS[s]

    if "dadra" in s or "daman" in s or "diu" in s:
        return "Dadra and Nagar Haveli and Daman and Diu"
    if "andaman" in s:
        return "Andaman and Nicobar Islands"
    if "delhi" in s:
        return "Delhi"

    # Default title casing
    return " ".join(word.capitalize() for word in state.strip().split())
