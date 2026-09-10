"""
tests.backend.test_benchmarking - Tests for Benchmarking endpoint (/api/v1/benchmarking).
"""


def test_get_benchmarking_valid(client):
    response = client.get("/api/v1/benchmarking?project_code=060100093")
    assert response.status_code == 200
    data = response.json()

    assert data["project_code"] == "060100093"
    assert "project_risk_score" in data
    assert "state_average_risk" in data
    assert "portfolio_average_risk" in data
    assert "portfolio_average_progress" in data
    assert 0.0 <= data["portfolio_average_risk"] <= 100.0


def test_get_benchmarking_not_found(client):
    response = client.get("/api/v1/benchmarking?project_code=NON_EXISTENT_BENCHMARK")
    assert response.status_code == 404
