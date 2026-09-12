"""
tests.backend.conftest - Test fixtures for FastAPI backend test suite.
"""

import sys
from pathlib import Path

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.repositories.project_repository import repository
from backend.app.services.prediction_service import prediction_service


from backend.app.core.security import create_access_token


@pytest.fixture(scope="session")
def unauthenticated_client():
    """Session-scoped TestClient without any authentication headers."""
    with TestClient(app) as test_client:
        if not repository.is_loaded:
            repository.load_data()
        if not prediction_service.is_loaded:
            prediction_service.load_models()
        yield test_client


@pytest.fixture(scope="session")
def client():
    """Session-scoped TestClient pre-authenticated as ADMIN for seamless test compatibility."""
    with TestClient(app) as test_client:
        if not repository.is_loaded:
            repository.load_data()
        if not prediction_service.is_loaded:
            prediction_service.load_models()
        token = create_access_token(data={
            "sub": "admin01",
            "role": "ADMIN",
            "full_name": "System Administrator",
            "email": "admin@infrastructure.gov.in"
        })
        test_client.headers["Authorization"] = f"Bearer {token}"
        yield test_client


