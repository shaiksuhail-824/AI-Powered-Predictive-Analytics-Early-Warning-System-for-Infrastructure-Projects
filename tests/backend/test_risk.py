"""
tests.backend.test_risk - Tests for Risk Analytics endpoints (/api/v1/risk/summary, /api/v1/projects/{code}/risk).
"""


def test_get_risk_summary(client):
    response = client.get("/api/v1/risk/summary")
    assert response.status_code == 200
    data = response.json()

    assert data["total_projects_evaluated"] >= 3500
    assert 0.0 <= data["average_risk_score"] <= 100.0
    assert "risk_distribution" in data
    assert "trajectory_distribution" in data
    assert "anomaly_distribution" in data
    assert "intervention_priority_distribution" in data


def test_get_project_risk_valid(client):
    response = client.get("/api/v1/projects/060100093/risk")
    assert response.status_code == 200
    data = response.json()

    assert data["project_code"] == "060100093"
    assert 0.0 <= data["schedule_delay_probability"] <= 1.0
    assert 0.0 <= data["cost_overrun_probability"] <= 1.0
    assert 0.0 <= data["overall_risk_score"] <= 100.0
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "top_risk_drivers" in data
    assert isinstance(data["top_risk_drivers"], list)
    assert len(data["top_risk_drivers"]) > 0


def test_get_project_risk_not_found(client):
    response = client.get("/api/v1/projects/NON_EXISTENT_PRJ_404/risk")
    assert response.status_code == 404
