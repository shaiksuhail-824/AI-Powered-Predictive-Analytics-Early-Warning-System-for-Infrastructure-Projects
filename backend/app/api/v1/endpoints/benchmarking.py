"""
backend.app.api.v1.endpoints.benchmarking - Project Benchmarking endpoint.
"""

from fastapi import APIRouter, Query, Depends
from backend.app.schemas.benchmarking import BenchmarkingResult
from backend.app.services.benchmarking_service import benchmarking_service
from backend.app.core.security import get_current_user
from backend.app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/benchmarking", response_model=BenchmarkingResult, summary="Get Project Benchmarking Comparison")
async def get_benchmarking(
    project_code: str = Query(..., description="Official alphanumeric project identifier to benchmark"),
    current_user: UserResponse = Depends(get_current_user),
) -> BenchmarkingResult:
    """Compare a project's risk score and progress rate against state, agency, and national portfolio averages."""
    return benchmarking_service.get_benchmarking(project_code)

