"""
backend.app.schemas.predict - Pydantic models for real-time scenario simulation and ML prediction requests.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from backend.app.schemas.common import RiskLevelEnum, RiskTrajectoryEnum, AnomalyStatusEnum, InterventionPriorityEnum
from backend.app.schemas.risk import DriverImpact


class SingleProjectPredictionRequest(BaseModel):
    project_code: Optional[str] = Field("SIM_PROJECT", description="Optional simulation identifier")
    original_cost_cr: float = Field(..., gt=0.0, description="Originally sanctioned cost in INR Crores")
    cumulative_expenditure_cr: float = Field(..., ge=0.0, description="Cumulative expenditure incurred to date")
    physical_progress_pct: float = Field(..., ge=0.0, le=100.0, description="Reported physical progress achieved (0-100%)")
    planned_duration_days: float = Field(..., gt=0.0, description="Planned total project duration in calendar days")
    elapsed_duration_days: float = Field(..., ge=0.0, description="Elapsed calendar days since project physical commencement")
    approval_to_start_days: Optional[float] = Field(180.0, ge=0.0, description="Days from approval to start")
    agency_frequency: Optional[float] = Field(0.05, ge=0.0, le=1.0, description="Normalized portfolio agency frequency weight")
    state_frequency: Optional[float] = Field(0.03, ge=0.0, le=1.0, description="Normalized portfolio state frequency weight")
    time_overrun_days: Optional[float] = Field(0.0, description="Prior recorded slippage in days")
    time_overrun_months: Optional[float] = Field(0.0, description="Prior recorded slippage in months")
    time_overrun_flag: Optional[int] = Field(0, ge=0, le=1, description="Prior delay status")


class SingleProjectPredictionResponse(BaseModel):
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
    data_status: str = Field("REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS", description="Regulatory provenance flag")
