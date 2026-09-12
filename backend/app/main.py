"""
backend.app.main - FastAPI Application Entrypoint for MoSPI PAIMANA Early-Warning Platform.
Configures lifespan state loading, CORS middleware, error handlers, and versioned routing.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.errors import (
    ProjectNotFoundError,
    StateNotFoundError,
    project_not_found_handler,
    state_not_found_handler,
)
from backend.app.repositories.project_repository import repository
from backend.app.services.prediction_service import prediction_service
from backend.app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler: Preload authoritative data and production ML models on startup."""
    print("[LIFESPAN] Starting MoSPI PAIMANA Predictive Analytics Backend...")
    try:
        repository.load_data()
    except Exception as e:
        print(f"[LIFESPAN WARNING] Failed to load data repository: {e}")

    try:
        prediction_service.load_models()
    except Exception as e:
        print(f"[LIFESPAN WARNING] Failed to load production ML models: {e}")

    print("[LIFESPAN] Backend initialization complete. Ready to serve requests.")
    yield
    print("[LIFESPAN] Shutting down backend service.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade RESTful API serving authentic MoSPI PAIMANA infrastructure monitoring data, "
        "longitudinal time-series analytics, and real-time machine learning predictions "
        "(Schedule Delay, Cost Overrun, and Anomaly Sentinel)."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# CORS configuration allowing local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(ProjectNotFoundError, project_not_found_handler)
app.add_exception_handler(StateNotFoundError, state_not_found_handler)

# Versioned API routes (/api/v1/...)
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Health & Discovery")
async def root():
    """Root endpoint providing service status and API documentation discovery links."""
    return JSONResponse({
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_v1_docs": f"{settings.API_V1_STR}/docs",
        "health_check": f"{settings.API_V1_STR}/health",
        "data_status": settings.DATA_STATUS,
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
