"""
backend.app.core.config - Application Configuration & Settings.
Loads configuration from environment variables with safe, project-relative fallbacks.
Avoids hardcoded Windows paths.
"""

from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator

# Base repository root directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "MoSPI PAIMANA Early-Warning & Predictive Analytics API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS settings
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    # Data file paths (Project-relative)
    DATA_PROCESSED_PATH: Path = BASE_DIR / "data" / "processed" / "paimana_time_overrun_processed.csv"
    CURRENT_PREDICTIONS_PATH: Path = BASE_DIR / "data" / "processed" / "paimana_current_data_predictions.csv"
    METADATA_PATH: Path = BASE_DIR / "data" / "processed" / "paimana_project_metadata.csv"
    RAW_DATA_PATH: Path = BASE_DIR / "data" / "raw" / "paimana_time_overrun.csv"

    # Model file paths
    MODELS_DIR: Path = BASE_DIR / "models"
    MODEL_CONFIG_PATH: Path = BASE_DIR / "configs" / "model_params.yaml"

    # Governance & Transparency
    DATA_STATUS: str = "SYNTHETIC / DEMONSTRATION"
    GOVERNANCE_NOTICE: str = (
        "This API provides predictive analytics and early warning signals based on the "
        "SIH26103 MoSPI PAIMANA Machine Learning framework. Values for unobserved futures "
        "are predictive indicators, not official administrative audit determinations."
    )

    # Authentication & Security
    JWT_SECRET: str = "nirman-drishti-mospi-jwt-secret-key-2026-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
