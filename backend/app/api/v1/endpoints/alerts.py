"""
backend.app.api.v1.endpoints.alerts - Early-Warning Alerts & Escalations endpoint.
"""

from typing import Optional
from fastapi import APIRouter, Query, Depends
from backend.app.schemas.alert import AlertListResponse, AlertSeverityEnum
from backend.app.services.alert_service import alert_service
from backend.app.core.security import get_current_user
from backend.app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/alerts", response_model=AlertListResponse, summary="Get Early-Warning Alerts")
async def list_alerts(
    severity: Optional[AlertSeverityEnum] = Query(None, description="Filter by severity: Medium, High, Critical"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of alerts to return"),
    current_user: UserResponse = Depends(get_current_user),
) -> AlertListResponse:
    """Retrieve active early warning signals generated from critical risk projects, escalations, and anomalies."""
    return alert_service.get_alerts(severity=severity, limit=limit)
