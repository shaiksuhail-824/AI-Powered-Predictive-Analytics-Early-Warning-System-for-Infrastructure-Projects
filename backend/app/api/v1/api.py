"""
backend.app.api.v1.api - Aggregated API v1 Router.
"""

from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    health,
    auth,
    projects,
    states,
    dashboard,
    risk,
    alerts,
    benchmarking,
    predict,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(projects.router, tags=["Projects"])
api_router.include_router(states.router, tags=["States"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
api_router.include_router(risk.router, tags=["Risk"])
api_router.include_router(alerts.router, tags=["Alerts"])
api_router.include_router(benchmarking.router, tags=["Benchmarking"])
api_router.include_router(predict.router, tags=["Predictions"])
