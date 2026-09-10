"""
backend.app.api.v1.endpoints.health - Service health and readiness endpoint.
"""

from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.repositories.project_repository import repository
from backend.app.services.prediction_service import prediction_service
from backend.app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="System Health & Readiness Check")
async def get_health() -> HealthResponse:
    """
    Returns system status, data repository indexing status, and ML model availability.
    Fast, lightweight check with zero expensive inference.
    """
    return HealthResponse(
        status="healthy" if repository.is_loaded else "initializing",
        version=settings.VERSION,
        data_loaded=repository.is_loaded,
        total_projects=repository.total_projects,
        total_observations=repository.total_observations,
        models_loaded=prediction_service.is_loaded,
        data_status=settings.DATA_STATUS,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
