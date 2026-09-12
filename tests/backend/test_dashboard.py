"""
tests.backend.test_dashboard - Tests for Dashboard endpoint (/api/v1/dashboard/overview).
"""


def test_dashboard_overview(client):
    response = client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()

    assert data["total_projects"] >= 3500
    assert data["high_risk_projects"] >= 0
    assert data["critical_risk_projects"] >= 0
    assert 0.0 <= data["average_risk_score"] <= 100.0

    # Verify risk distribution consistency
    dist = data["risk_distribution"]
    sum_dist = dist["LOW"] + dist["MEDIUM"] + dist["HIGH"] + dist["CRITICAL"]
    assert sum_dist == data["total_projects"]

    # Verify state summaries
    assert "state_summaries" in data
    assert len(data["state_summaries"]) > 0

    # Verify recent alerts
    assert "recent_alerts" in data
    assert isinstance(data["recent_alerts"], list)

    # Verify risk trend
    assert "risk_trend" in data
    assert len(data["risk_trend"]) > 0
    first_trend = data["risk_trend"][0]
    assert "month" in first_trend
    assert "average_risk_score" in first_trend
