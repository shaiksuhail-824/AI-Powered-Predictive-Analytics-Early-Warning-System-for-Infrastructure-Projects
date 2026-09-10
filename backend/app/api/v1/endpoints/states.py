"""
backend.app.api.v1.endpoints.states - State-level risk breakdown and map integration endpoints.
"""

from typing import List
from fastapi import APIRouter, Path, Depends
from backend.app.schemas.state import StateSummary, StateStats
from backend.app.services.state_service import state_service
from backend.app.core.security import get_current_user
from backend.app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/states", response_model=List[StateSummary], summary="List All States & UTs Summary")
async def list_states(
    current_user: UserResponse = Depends(get_current_user),
) -> List[StateSummary]:
    """Retrieve summary metrics and dominant risk levels for all States and Union Territories."""
    return state_service.get_all_state_summaries()


@router.get("/states/{state}", response_model=StateStats, summary="Get Detailed State Statistics")
async def get_state_details(
    state: str = Path(..., description="State or Union Territory name (automatically normalized)"),
    current_user: UserResponse = Depends(get_current_user),
) -> StateStats:
    """Retrieve comprehensive risk profile, CPSE distribution, and top critical projects for a state."""
    return state_service.get_state_stats(state)

