"""
backend.app.schemas.risk - Pydantic models for Risk Analytics, SHAP Drivers, and Portfolio Summary.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from backend.app.schemas.common import RiskLevelEnum, RiskTrajectoryEnum, AnomalyStatusEnum, InterventionPriorityEnum


class DriverImpact(BaseModel):
    feature: str = Field(..., description="Feature identifier")
    impact: float = Field(..., description="SHAP attribution magnitude or relative impact")
    value: Optional[float] = Field(None, description="Raw feature value at observation time")


class RiskPrediction(BaseModel):
    project_code: str
    prediction_timestamp: str
    schedule_delay_probability: float
    cost_overrun_probability: float
    overall_risk_score: float
    risk_level: RiskLevelEnum
    risk_trajectory: RiskTrajectoryEnum
    risk_delta: float
    anomaly_status: AnomalyStatusEnum
    intervention_priority: InterventionPriorityEnum
    top_risk_drivers: List[DriverImpact]
    what_changed_since_last_month: Optional[Dict[str, Any]] = None
    data_status: str = Field("REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS", description="Regulatory notice flag")


class RiskDistribution(BaseModel):
    LOW: int
    MEDIUM: int
    HIGH: int
    CRITICAL: int


class RiskSummary(BaseModel):
    total_projects_evaluated: int
    average_risk_score: float
    risk_distribution: RiskDistribution
    trajectory_distribution: Dict[str, int]
    anomaly_distribution: Dict[str, int]
    intervention_priority_distribution: Dict[str, int]
    primary_risk_driver_distribution: Dict[str, int]
    data_status: str = Field("REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS", description="Regulatory notice flag")
