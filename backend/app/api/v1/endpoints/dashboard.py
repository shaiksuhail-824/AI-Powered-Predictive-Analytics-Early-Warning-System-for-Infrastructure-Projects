"""
backend.app.api.v1.endpoints.dashboard - Executive Dashboard overview endpoint.
"""

from fastapi import APIRouter, Depends
from backend.app.schemas.dashboard import DashboardOverview
from backend.app.services.dashboard_service import dashboard_service
from backend.app.core.security import require_roles
from backend.app.schemas.auth import RoleEnum, UserResponse

router = APIRouter()


@router.get("/dashboard/overview", response_model=DashboardOverview, summary="Get Executive Dashboard Overview")
async def get_dashboard_overview(
    current_user: UserResponse = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.MINISTRY_PROJECT_HEAD))
) -> DashboardOverview:
    """
    Returns portfolio-level metrics: total active projects, risk distributions,
    state-level summaries, critical early-warning alerts, and historical portfolio risk trends.
    """
    return dashboard_service.get_dashboard_overview()
