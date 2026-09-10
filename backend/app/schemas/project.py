"""
backend.app.schemas.project - Pydantic schemas for Project entity and time-series history.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import RiskLevelEnum, RiskTrajectoryEnum, ProjectStatusEnum


class ProjectSummary(BaseModel):
    project_code: str = Field(..., description="Official MoSPI unique alphanumeric project identifier")
    project_name: str = Field(..., description="Project title from master records")
    agency: Optional[str] = Field(None, description="Implementing CPSE or department")
    state: Optional[str] = Field(None, description="Canonical State or UT jurisdiction")
    ministry: Optional[str] = Field(None, description="Administrative Ministry if available")
    sector: Optional[str] = Field(None, description="Infrastructure sector if available")
    original_cost_cr: float = Field(..., description="Original sanctioned cost in INR Crores")
    cumulative_expenditure_cr: float = Field(..., description="Cumulative expenditure incurred in INR Crores")
    physical_progress_pct: float = Field(..., description="Reported physical progress percentage (0-100)")
    status: ProjectStatusEnum = Field(..., description="Current operational monitoring status")
    overall_risk_score: float = Field(..., description="Standardized composite risk score (0-100)")
    risk_level: RiskLevelEnum = Field(..., description="Risk tier: LOW, MEDIUM, HIGH, or CRITICAL")
    time_overrun_days: float = Field(..., description="Recorded schedule slippage in calendar days")
    time_overrun_flag: int = Field(..., description="Binary indicator: 1 = delayed, 0 = on schedule")
    latest_report_date: str = Field(..., description="Date of the latest recorded monitoring snapshot (YYYY-MM-DD)")


class ProjectHistoryItem(BaseModel):
    report_date: str = Field(..., description="Observation snapshot date (YYYY-MM-DD)")
    report_year: int
    report_month_num: int
    original_cost_cr: float
    cumulative_expenditure_cr: float
    physical_progress_pct: float
    elapsed_duration_pct: float
    schedule_progress_gap_pct: float
    time_overrun_days: float
    time_overrun_months: float
    time_overrun_flag: int


class ProjectDetail(ProjectSummary):
    revised_cost_cr: Optional[float] = Field(None, description="Revised approved cost if sanctioned")
    elapsed_duration_pct: float = Field(..., description="Percentage of planned lifecycle duration elapsed")
    schedule_progress_gap_pct: float = Field(..., description="Slippage gap: physical_progress - elapsed_duration_pct")
    approval_to_start_days: Optional[float] = Field(None, description="Days from sanction to physical commencement")
    planned_duration_days: Optional[float] = Field(None, description="Baseline execution duration in days")
    elapsed_duration_days: Optional[float] = Field(None, description="Elapsed execution days from commencement")
    time_overrun_months: float = Field(..., description="Normalized schedule overrun in months")
    schedule_delay_probability: Optional[float] = Field(None, description="Model-predicted probability of future delay")
    cost_overrun_probability: Optional[float] = Field(None, description="Model-predicted probability of budget overrun")
    risk_trajectory: Optional[RiskTrajectoryEnum] = Field(None, description="Month-over-month risk velocity direction")
    risk_delta: Optional[float] = Field(None, description="Month-over-month shift in risk score")
    anomaly_status: Optional[str] = Field(None, description="Sentinel anomaly classification tier")
    intervention_priority: Optional[str] = Field(None, description="Executive intervention priority tier")
    start_date: Optional[str] = Field(None, description="Physical commencement date")
    approval_date: Optional[str] = Field(None, description="Sanction date")
    original_completion_date: Optional[str] = Field(None, description="Original target DOC")
    revised_completion_date: Optional[str] = Field(None, description="Revised target DOC")
    data_status: str = Field("SYNTHETIC / DEMONSTRATION", description="Regulatory provenance flag")
