"""
tests.backend.test_projects - Tests for Project endpoints (/api/v1/projects).
"""


def test_list_projects_pagination(client):
    response = client.get("/api/v1/projects?page=1&page_size=15")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) == 15
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["page_size"] == 15
    assert data["pagination"]["total_items"] >= 3500
    assert data["pagination"]["has_next"] is True


def test_get_project_detail_valid(client):
    response = client.get("/api/v1/projects/060100093")
    assert response.status_code == 200
    data = response.json()
    assert data["project_code"] == "060100093"
    assert "GEVRA" in data["project_name"]
    assert data["agency"] == "SECL"
    assert data["state"] == "Chhattisgarh"
    assert data["original_cost_cr"] > 0
    assert "overall_risk_score" in data
    assert "risk_level" in data
    assert "time_overrun_days" in data


def test_get_project_not_found(client):
    response = client.get("/api/v1/projects/NON_EXISTENT_PROJECT_999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "PROJECT_NOT_FOUND"


def test_project_filter_by_state(client):
    response = client.get("/api/v1/projects?state=Chhattisgarh&page_size=50")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0
    for p in data["items"]:
        assert p["state"] == "Chhattisgarh"


def test_project_filter_by_risk_level(client):
    response = client.get("/api/v1/projects?risk_level=CRITICAL&page_size=20")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0
    for p in data["items"]:
        assert p["risk_level"] == "CRITICAL"


def test_project_filter_delayed_only(client):
    response = client.get("/api/v1/projects?delayed_only=true&page_size=20")
    assert response.status_code == 200
    data = response.json()
    for p in data["items"]:
        assert p["time_overrun_flag"] == 1


def test_get_project_history(client):
    response = client.get("/api/v1/projects/060100093/history")
    assert response.status_code == 200
    history = response.json()
    assert isinstance(history, list)
    assert len(history) > 0
    first = history[0]
    assert "report_date" in first
    assert "physical_progress_pct" in first
    assert "cumulative_expenditure_cr" in first


def test_get_project_history_not_found(client):
    response = client.get("/api/v1/projects/INVALID_PROJECT/history")
    assert response.status_code == 404
