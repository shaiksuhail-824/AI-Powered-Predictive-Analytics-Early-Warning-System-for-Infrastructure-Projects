"""
tests.backend.test_states - Tests for State endpoints (/api/v1/states).
"""


def test_list_states(client):
    response = client.get("/api/v1/states")
    assert response.status_code == 200
    states = response.json()
    assert isinstance(states, list)
    assert len(states) >= 25
    first = states[0]
    assert "state_name" in first
    assert "total_projects" in first
    assert "dominant_risk_level" in first


def test_get_state_detail_valid(client):
    response = client.get("/api/v1/states/Maharashtra")
    assert response.status_code == 200
    data = response.json()
    assert data["state_name"] == "Maharashtra"
    assert data["total_projects"] > 0
    assert "average_risk" in data
    assert "agency_distribution" in data
    assert isinstance(data["agency_distribution"], list)
    assert "top_critical_projects" in data


def test_get_state_detail_normalization(client):
    # Test lowercase and synonyms
    for query_name in ["maharashtra", "MAHARASHTRA", "jammu & kashmir", "odisha"]:
        response = client.get(f"/api/v1/states/{query_name}")
        assert response.status_code == 200
        data = response.json()
        assert data["total_projects"] > 0


def test_get_state_not_found(client):
    response = client.get("/api/v1/states/NON_EXISTENT_ATLANTIS")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "STATE_NOT_FOUND"
