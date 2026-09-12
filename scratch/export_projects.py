import json
import os
import sys

workspace_root = os.path.abspath(".")
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

from backend.app.repositories.project_repository import repository

if not repository.is_loaded:
    repository.load_data()

projects = repository._latest_projects_list
print(f"Loaded {len(projects)} projects from backend repository.")

formatted = []
for p in projects:
    risk_score = round(p.get("overall_risk_score") or 0)
    risk_level = "Low"
    ru = (p.get("risk_level") or "").upper()
    if ru == "CRITICAL":
        risk_level = "Critical"
    elif ru == "HIGH":
        risk_level = "High"
    elif ru == "MEDIUM":
        risk_level = "Medium"

    status = "On Track"
    st = str(p.get("status") or "")
    if "Critical" in st:
        status = "Critical"
    elif "Delayed" in st:
        status = "Delayed"
    elif "Watch" in st:
        status = "Watch"

    formatted.append({
        "projectId": p["project_code"],
        "projectName": p.get("project_name") or f"Project {p['project_code']}",
        "ministry": p.get("ministry") or "Ministry of Infrastructure",
        "agency": p.get("agency") or "Central CPSE",
        "state": p.get("state") or "Multi-State",
        "sector": p.get("sector") or (f"{p.get('agency')} Sector" if p.get("agency") else "Infrastructure"),
        "originalCost": p.get("original_cost_cr") or 0,
        "revisedCost": p.get("revised_cost_cr") or p.get("original_cost_cr") or 0,
        "startDate": p.get("start_date"),
        "originalCompletionDate": p.get("original_completion_date") or "2026-12-31",
        "revisedCompletionDate": p.get("revised_completion_date") or "2027-03-31",
        "physicalProgress": p.get("physical_progress_pct") or 0,
        "plannedProgress": p.get("elapsed_duration_pct"),
        "expenditure": p.get("cumulative_expenditure_cr") or 0,
        "status": status,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "costOverrunRisk": round(p["cost_overrun_probability"] * 100) if p.get("cost_overrun_probability") is not None else None,
        "timeOverrunRisk": round(p["schedule_delay_probability"] * 100) if p.get("schedule_delay_probability") is not None else None,
    })

out_path = os.path.join("frontend", "data", "realProjects.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(formatted, f, indent=2)

print(f"Exported {len(formatted)} projects to {out_path} ({os.path.getsize(out_path)} bytes)")
