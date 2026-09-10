"""
backend.app.schemas.alert - Pydantic schemas for automated alerts and escalations.
"""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class AlertSeverityEnum(str, Enum):
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class AlertStatusEnum(str, Enum):
    NEW = "New"
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    ESCALATED = "Escalated"


class AlertItem(BaseModel):
    alert_id: str = Field(..., description="Unique alert identifier")
    project_code: str = Field(..., description="Affected infrastructure project code")
    project_name: str = Field(..., description="Project title")
    severity: AlertSeverityEnum = Field(..., description="Alert urgency tier")
    alert_type: str = Field(..., description="Type of alert: CRITICAL_RISK, RAPID_ESCALATION, ANOMALY_REPORTING")
    message: str = Field(..., description="Detailed early-warning diagnostic message")
    state: Optional[str] = Field(None, description="Project state jurisdiction")
    agency: Optional[str] = Field(None, description="Implementing agency")
    risk_score: float = Field(..., description="Current overall risk score")
    status: AlertStatusEnum = Field(default=AlertStatusEnum.NEW)
    created_at: str = Field(..., description="Timestamp when the warning was generated")


class AlertListResponse(BaseModel):
    total_alerts: int
    critical_count: int
    high_count: int
    medium_count: int
    alerts: List[AlertItem]
