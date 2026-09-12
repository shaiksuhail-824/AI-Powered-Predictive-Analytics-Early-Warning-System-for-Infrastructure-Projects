"""
tests.backend.test_alerts - Tests for Alerts endpoint (/api/v1/alerts).
"""


def test_list_alerts(client):
    response = client.get("/api/v1/alerts?limit=25")
    assert response.status_code == 200
    data = response.json()

    assert data["total_alerts"] > 0
    assert len(data["alerts"]) <= 25
    first = data["alerts"][0]
    assert "alert_id" in first
    assert "severity" in first
    assert "message" in first
    assert "risk_score" in first


def test_list_alerts_filter_critical(client):
    response = client.get("/api/v1/alerts?severity=Critical&limit=10")
    assert response.status_code == 200
    data = response.json()
    for a in data["alerts"]:
        assert a["severity"] == "Critical"
