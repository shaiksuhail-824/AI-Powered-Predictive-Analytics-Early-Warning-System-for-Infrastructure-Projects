"""
tests.backend.test_health - Tests for GET /api/v1/health.
"""


def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["data_loaded"] is True
    assert data["total_projects"] >= 3500
    assert data["total_observations"] >= 17000
    assert data["models_loaded"] is True
    assert "REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS" in data["data_status"]


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["api_v1_docs"] == "/api/v1/docs"
