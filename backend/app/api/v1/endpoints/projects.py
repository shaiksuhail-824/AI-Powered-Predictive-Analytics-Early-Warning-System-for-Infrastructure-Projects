"""
backend.app.api.v1.endpoints.projects - Project query, details, and longitudinal history endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, Path, Depends
from backend.app.schemas.common import PaginatedResponse
from backend.app.schemas.project import ProjectSummary, ProjectDetail, ProjectHistoryItem
from backend.app.services.project_service import project_service
from backend.app.core.security import get_current_user
from backend.app.schemas.auth import RoleEnum, UserResponse

router = APIRouter()


@router.get("/projects", response_model=PaginatedResponse[ProjectSummary], summary="Query & Filter Projects")
async def list_projects(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)"),
    state: Optional[str] = Query(None, description="Filter by canonical state name"),
    risk_level: Optional[str] = Query(None, description="Filter by risk tier: LOW, MEDIUM, HIGH, CRITICAL"),
    delayed_only: Optional[bool] = Query(None, description="Filter only projects experiencing schedule delay"),
    search: Optional[str] = Query(None, description="Search by project_code, name, or agency"),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[ProjectSummary]:
    """Retrieve paginated central infrastructure projects with filtering capabilities."""
    effective_search = search
    # If AGENCY_CONTRACTOR has a scoped agency and no search is specified, default search to their agency
    if current_user.role == RoleEnum.AGENCY_CONTRACTOR and current_user.scoped_agency and not search:
        effective_search = current_user.scoped_agency

    return project_service.get_projects(
        page=page,
        page_size=page_size,
        state=state,
        risk_level=risk_level,
        delayed_only=delayed_only,
        search=effective_search,
    )


@router.get("/projects/{project_code}", response_model=ProjectDetail, summary="Get Project Details")
async def get_project(
    project_code: str = Path(..., description="Official alphanumeric project identifier"),
    current_user: UserResponse = Depends(get_current_user),
) -> ProjectDetail:
    """Retrieve full operational and risk details for a single project."""
    return project_service.get_project_detail(project_code)


@router.get("/projects/{project_code}/history", response_model=List[ProjectHistoryItem], summary="Get Project Longitudinal History")
async def get_project_history(
    project_code: str = Path(..., description="Official alphanumeric project identifier"),
    current_user: UserResponse = Depends(get_current_user),
) -> List[ProjectHistoryItem]:
    """Retrieve monthly monitoring progression records for timeline and trajectory charts."""
    return project_service.get_project_history(project_code)
