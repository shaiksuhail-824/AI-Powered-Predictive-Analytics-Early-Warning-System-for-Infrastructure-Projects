"""
tests.backend.test_auth - Tests for Authentication & Role-Based Access Control (RBAC).
"""

import pytest
from backend.app.core.security import create_access_token


def test_login_success_admin(unauthenticated_client):
    """Test login with admin credentials."""
    response = unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"username": "admin01", "password": "Admin@2026#Secure"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin01"
    assert data["user"]["role"] == "ADMIN"


def test_login_success_legacy_credential(unauthenticated_client):
    """Test login with supported backward-compatible demo credential."""
    response = unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"username": "admin01", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"


def test_login_success_ministry(unauthenticated_client):
    """Test login with ministry credentials."""
    response = unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"username": "ministry01", "password": "Ministry@2026#Secure"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "MINISTRY_PROJECT_HEAD"


def test_login_success_agency(unauthenticated_client):
    """Test login with agency contractor credentials."""
    response = unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"username": "agency01", "password": "Agency@2026#Secure"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "AGENCY_CONTRACTOR"
    assert data["user"]["scoped_agency"] == "NHAI"


def test_login_invalid_password(unauthenticated_client):
    """Test login failure with wrong password returns 401."""
    response = unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"username": "admin01", "password": "WrongPassword999!"}
    )
    assert response.status_code == 401
    assert "Invalid username or password" in response.json()["detail"]


def test_login_nonexistent_user(unauthenticated_client):
    """Test login failure with unknown user returns 401."""
    response = unauthenticated_client.post(
        "/api/v1/auth/login",
        json={"username": "unknown_user", "password": "Password123!"}
    )
    assert response.status_code == 401


def test_auth_me_valid_token(unauthenticated_client):
    """Test /auth/me returns current user identity with valid token."""
    token = create_access_token(data={
        "sub": "admin01",
        "role": "ADMIN",
        "full_name": "System Administrator",
        "email": "admin@infrastructure.gov.in"
    })
    response = unauthenticated_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin01"
    assert data["role"] == "ADMIN"


def test_auth_me_missing_token(unauthenticated_client):
    """Test /auth/me without token returns 401."""
    response = unauthenticated_client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_auth_me_invalid_token(unauthenticated_client):
    """Test /auth/me with invalid or forged token returns 401."""
    response = unauthenticated_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.signature"}
    )
    assert response.status_code == 401


def test_rbac_admin_dashboard_allowed(unauthenticated_client):
    """Test ADMIN role can access /dashboard/overview."""
    token = create_access_token(data={"sub": "admin01", "role": "ADMIN", "full_name": "Admin"})
    response = unauthenticated_client.get(
        "/api/v1/dashboard/overview",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200


def test_rbac_ministry_dashboard_allowed(unauthenticated_client):
    """Test MINISTRY_PROJECT_HEAD role can access /dashboard/overview."""
    token = create_access_token(data={"sub": "ministry01", "role": "MINISTRY_PROJECT_HEAD", "full_name": "Ministry"})
    response = unauthenticated_client.get(
        "/api/v1/dashboard/overview",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200


def test_rbac_agency_dashboard_forbidden(unauthenticated_client):
    """Test AGENCY_CONTRACTOR role is forbidden (403) from /dashboard/overview."""
    token = create_access_token(data={"sub": "agency01", "role": "AGENCY_CONTRACTOR", "full_name": "Agency Contractor"})
    response = unauthenticated_client.get(
        "/api/v1/dashboard/overview",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "does not have permission" in response.json()["detail"].lower()



def test_rbac_agency_predict_forbidden(unauthenticated_client):
    """Test AGENCY_CONTRACTOR role cannot invoke /predict/project."""
    token = create_access_token(data={"sub": "agency01", "role": "AGENCY_CONTRACTOR", "full_name": "Agency Contractor"})
    response = unauthenticated_client.post(
        "/api/v1/predict/project",
        json={"project_code": "NHAI-001"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403


def test_unauthenticated_protected_endpoints(unauthenticated_client):
    """Test that all core endpoints return 401 when no token is supplied."""
    endpoints = [
        ("GET", "/api/v1/dashboard/overview"),
        ("GET", "/api/v1/projects"),
        ("GET", "/api/v1/states"),
        ("GET", "/api/v1/alerts"),
        ("GET", "/api/v1/risk/summary"),
        ("GET", "/api/v1/benchmarking?project_code=PRJ-1001"),
    ]
    for method, path in endpoints:
        if method == "GET":
            resp = unauthenticated_client.get(path)
        else:
            resp = unauthenticated_client.post(path)
        assert resp.status_code == 401, f"Expected 401 for {path}, got {resp.status_code}"
