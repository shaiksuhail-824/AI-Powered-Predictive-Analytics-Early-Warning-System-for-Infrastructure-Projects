"""
backend.app.schemas.benchmarking - Pydantic models for comparative project benchmarking.
"""

from typing import Optional
from pydantic import BaseModel, Field


class BenchmarkingResult(BaseModel):
    project_code: str = Field(..., description="Benchmarked project identifier")
    project_name: str = Field(..., description="Benchmarked project title")
    project_risk_score: float = Field(..., description="Project overall risk score")
    project_progress_pct: float = Field(..., description="Project physical progress percentage")
    state_name: Optional[str] = Field(None, description="State jurisdiction")
    state_average_risk: float = Field(..., description="Average risk score across projects in the same state")
    state_average_progress: float = Field(..., description="Average physical progress across projects in the same state")
    portfolio_average_risk: float = Field(..., description="National portfolio mean risk score")
    portfolio_average_progress: float = Field(..., description="National portfolio mean progress percentage")
    agency: Optional[str] = Field(None, description="Implementing CPSE")
    agency_average_risk: Optional[float] = Field(None, description="Average risk score for the same agency")
    agency_average_progress: Optional[float] = Field(None, description="Average progress for the same agency")
    risk_percentile_in_state: Optional[float] = Field(None, description="Percentile rank of project risk within state (0-100)")
