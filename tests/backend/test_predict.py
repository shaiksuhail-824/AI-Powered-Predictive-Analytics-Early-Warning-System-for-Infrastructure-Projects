"""
tests.backend.test_predict - Tests for Real-Time ML Scenario Prediction (/api/v1/predict/project).
"""


def test_predict_project_valid(client):
    payload = {
        "project_code": "TEST_PROJECT_01",
        "original_cost_cr": 4500.0,
        "cumulative_expenditure_cr": 3200.0,
        "physical_progress_pct": 45.0,
        "planned_duration_days": 1095.0,
        "elapsed_duration_days": 800.0,
        "approval_to_start_days": 180.0,
        "agency_frequency": 0.08,
        "state_frequency": 0.04,
        "time_overrun_days": 120.0,
        "time_overrun_months": 4.0,
        "time_overrun_flag": 1,
    }
    response = client.post("/api/v1/predict/project", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["project_code"] == "TEST_PROJECT_01"
    assert 0.0 <= data["schedule_delay_probability"] <= 1.0
    assert 0.0 <= data["cost_overrun_probability"] <= 1.0
    assert 0.0 <= data["overall_risk_score"] <= 100.0
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "top_risk_drivers" in data
    assert isinstance(data["top_risk_drivers"], list)
    assert len(data["top_risk_drivers"]) > 0


def test_predict_project_invalid_payload(client):
    # Missing required original_cost_cr
    payload = {
        "project_code": "INVALID_TEST",
        "cumulative_expenditure_cr": 100.0,
    }
    response = client.post("/api/v1/predict/project", json=payload)
    assert response.status_code == 422
