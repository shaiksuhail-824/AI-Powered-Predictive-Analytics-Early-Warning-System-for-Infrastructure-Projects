"""
backend.app.schemas.state - Schemas for state-level statistics and map integration.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import RiskLevelEnum
from backend.app.schemas.project import ProjectSummary


class AgencyDistributionItem(BaseModel):
    agency: str
    count: int


class StateSummary(BaseModel):
    state_name: str = Field(..., description="Canonical State / UT name")
    total_projects: int
    high_risk_projects: int
    critical_risk_projects: int
    delayed_projects: int
    average_risk_score: float
    dominant_risk_level: RiskLevelEnum


class StateStats(BaseModel):
    state_name: str = Field(..., description="Canonical State or Union Territory name")
    total_projects: int = Field(..., description="Total active central projects located in this state")
    high_risk_projects: int = Field(..., description="Projects in HIGH risk tier (score >= 50 and < 75)")
    critical_risk_projects: int = Field(..., description="Projects in CRITICAL risk tier (score >= 75)")
    cost_risk_projects: int = Field(..., description="Projects with cost overrun risk signal")
    time_risk_projects: int = Field(..., description="Projects with active schedule overrun")
    average_risk: float = Field(..., description="Mean overall risk score across all state projects")
    risk_level: RiskLevelEnum = Field(..., description="State dominant risk level tier")
    agency_distribution: List[AgencyDistributionItem] = Field(default_factory=list, description="Count of projects by CPSE")
    top_critical_projects: List[ProjectSummary] = Field(default_factory=list, description="Highest-risk projects in this state")
