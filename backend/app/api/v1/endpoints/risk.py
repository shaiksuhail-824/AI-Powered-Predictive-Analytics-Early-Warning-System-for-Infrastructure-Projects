"""
backend.app.api.v1.endpoints.risk - Risk Analytics and Project Risk Prediction endpoints.
"""

from fastapi import APIRouter, Path, Depends
from backend.app.schemas.risk import RiskSummary, RiskPrediction
from backend.app.services.risk_service import risk_service
from backend.app.core.security import get_current_user
from backend.app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/risk/summary", response_model=RiskSummary, summary="Get Portfolio Risk Summary")
async def get_risk_summary(
    current_user: UserResponse = Depends(get_current_user),
) -> RiskSummary:
    """Returns portfolio-wide risk profile, trajectory distributions, and primary risk driver prevalence."""
    return risk_service.get_portfolio_risk_summary()


@router.get("/projects/{project_code}/risk", response_model=RiskPrediction, summary="Get Detailed Project Risk Profile")
async def get_project_risk(
    project_code: str = Path(..., description="Official alphanumeric project identifier"),
    current_user: UserResponse = Depends(get_current_user),
) -> RiskPrediction:
    """Returns ML-predicted schedule & cost probabilities, SHAP causal drivers, and anomaly flags."""
    return risk_service.get_project_risk(project_code)

