"""
backend.app.schemas.health - Health check response schema.
"""

from typing import Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    version: str = Field(..., json_schema_extra={"example": "1.0.0"})
    data_loaded: bool = Field(..., description="Whether repository records are loaded in memory")
    total_projects: int = Field(..., description="Total unique projects indexed")
    total_observations: int = Field(..., description="Total monthly observation rows")
    models_loaded: bool = Field(..., description="Whether production ML models are ready")
    data_status: str = Field(..., json_schema_extra={"example": "SYNTHETIC / DEMONSTRATION"})
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of check")
