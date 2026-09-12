"""
backend.app.schemas.dashboard - Pydantic models for Executive Dashboard Overview.
"""

from typing import List, Dict
from pydantic import BaseModel, Field
from backend.app.schemas.risk import RiskDistribution
from backend.app.schemas.state import StateSummary
from backend.app.schemas.alert import AlertItem


class RiskTrendItem(BaseModel):
    month: str = Field(..., description="Observation period in YYYY-MM format")
    average_risk_score: float = Field(..., description="Average risk score across portfolio")
    delayed_percentage: float = Field(..., description="Percentage of projects with schedule overrun")
    total_active_projects: int = Field(..., description="Count of projects monitored in that month")


class DashboardOverview(BaseModel):
    total_projects: int = Field(..., description="Total active central projects monitored")
    high_risk_projects: int = Field(..., description="Count of projects in HIGH risk category")
    critical_risk_projects: int = Field(..., description="Count of projects in CRITICAL risk category")
    delayed_projects: int = Field(..., description="Count of projects with recorded time overrun")
    average_risk_score: float = Field(..., description="Portfolio-wide mean risk score (0-100)")
    risk_distribution: RiskDistribution = Field(..., description="Categorical breakdown of portfolio risk")
    state_summaries: List[StateSummary] = Field(default_factory=list, description="State-by-state high-level metrics")
    recent_alerts: List[AlertItem] = Field(default_factory=list, description="Top critical recent early warning alerts")
    risk_trend: List[RiskTrendItem] = Field(default_factory=list, description="Longitudinal portfolio risk trajectory")
    data_status: str = Field("SYNTHETIC / DEMONSTRATION", description="Regulatory warning flag")
