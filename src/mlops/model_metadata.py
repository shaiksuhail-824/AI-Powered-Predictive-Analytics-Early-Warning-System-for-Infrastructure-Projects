"""
src/mlops/model_metadata.py - Model Metadata, Lineage, and Governance Specifications
Encapsulates authoritative model metadata, provenance, input/output schemas,
and data provenance metadata required by MoSPI SIH26103.
"""

from datetime import datetime
from typing import Dict, Any

DATA_STATUS = "REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS"
DATA_STATUS_WARNING = (
    "DATA PROVENANCE: This model artifact was trained on REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS "
    "for predictive analytics and early warning monitoring under MoSPI SIH26103."
)

SCHEMA_VERSION = "1.0.0"

API_OUTPUT_SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "PAIMANAPredictionOutput",
    "type": "object",
    "required": [
        "project_code",
        "prediction_timestamp",
        "schedule_delay_probability",
        "cost_overrun_probability",
        "overall_risk_score",
        "risk_level",
        "risk_trajectory",
        "risk_delta",
        "anomaly_status",
        "intervention_priority",
        "top_risk_drivers"
    ],
    "properties": {
        "project_code": {"type": "string"},
        "prediction_timestamp": {"type": "string", "format": "date-time"},
        "schedule_delay_probability": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        "cost_overrun_probability": {"type": "number", "minimum": 0.0, "maximum": 1.0},
        "overall_risk_score": {"type": "number", "minimum": 0.0, "maximum": 100.0},
        "risk_level": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]},
        "risk_trajectory": {"type": "string", "enum": ["STABLE", "DE_ESCALATING", "MODERATE_RISE", "RAPID_ESCALATION"]},
        "risk_delta": {"type": "number"},
        "anomaly_status": {"type": "string", "enum": ["NORMAL", "UNUSUAL", "ANOMALOUS", "REQUIRES_VERIFICATION"]},
        "intervention_priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL_INTERVENTION"]},
        "top_risk_drivers": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["feature", "impact"],
                "properties": {
                    "feature": {"type": "string"},
                    "value": {"type": "number"},
                    "impact": {"type": "number"}
                }
            }
        },
        "what_changed_since_last_month": {
            "type": "object",
            "properties": {
                "progress_delta": {"type": "number"},
                "expenditure_delta": {"type": "number"},
                "cost_revision_delta": {"type": "number"},
                "schedule_revision_delta": {"type": "number"},
                "summary": {"type": "string"}
            }
        },
        "data_status": {"type": "string"}
    }
}


def get_model_card(model_name: str,
                   target_name: str,
                   algorithm: str,
                   metrics: Dict[str, float],
                   features: list) -> Dict[str, Any]:
    """Build standardized Model Card documenting architecture and verification metrics."""
    return {
        "model_name": model_name,
        "problem_statement": "SIH26103 - AI-Powered Predictive Analytics for Infrastructure (PAIMANA)",
        "target_name": target_name,
        "algorithm": algorithm,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "schema_version": SCHEMA_VERSION,
        "data_status": DATA_STATUS,
        "data_status_warning": DATA_STATUS_WARNING,
        "features_count": len(features),
        "features_list": features,
        "metrics": metrics,
        "lifecycle_stage": "PRODUCTION"
    }
