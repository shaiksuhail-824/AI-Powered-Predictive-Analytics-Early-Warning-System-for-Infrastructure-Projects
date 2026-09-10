"""
backend.app.services.risk_service - Portfolio Risk Analytics and Project Risk Retrieval.
"""

from collections import Counter
from typing import Dict, Any, List
from backend.app.core.config import settings
from backend.app.core.errors import ProjectNotFoundError
from backend.app.repositories.project_repository import repository
from backend.app.schemas.risk import RiskPrediction, RiskSummary, RiskDistribution, DriverImpact
from backend.app.schemas.common import RiskLevelEnum, RiskTrajectoryEnum, AnomalyStatusEnum, InterventionPriorityEnum


class RiskService:

    def get_portfolio_risk_summary(self) -> RiskSummary:
        projects, _ = repository.get_all_projects(page=1, page_size=repository.total_projects)
        total = len(projects)

        if total == 0:
            return RiskSummary(
                total_projects_evaluated=0,
                average_risk_score=0.0,
                risk_distribution=RiskDistribution(LOW=0, MEDIUM=0, HIGH=0, CRITICAL=0),
                trajectory_distribution={},
                anomaly_distribution={},
                intervention_priority_distribution={},
                primary_risk_driver_distribution={},
                data_status=settings.DATA_STATUS,
            )

        avg_risk = round(sum(p["overall_risk_score"] for p in projects) / total, 2)
        r_counts = Counter(p["risk_level"] for p in projects)
        traj_counts = Counter(p.get("risk_trajectory", "STABLE") for p in projects)
        anom_counts = Counter(p.get("anomaly_status", "NORMAL") for p in projects)
        prio_counts = Counter(p.get("intervention_priority", "LOW") for p in projects)
        driver_counts = Counter(p.get("top_risk_driver", "schedule_progress_gap_pct") for p in projects)

        return RiskSummary(
            total_projects_evaluated=total,
            average_risk_score=avg_risk,
            risk_distribution=RiskDistribution(
                LOW=r_counts.get("LOW", 0),
                MEDIUM=r_counts.get("MEDIUM", 0),
                HIGH=r_counts.get("HIGH", 0),
                CRITICAL=r_counts.get("CRITICAL", 0),
            ),
            trajectory_distribution=dict(traj_counts),
            anomaly_distribution=dict(anom_counts),
            intervention_priority_distribution=dict(prio_counts),
            primary_risk_driver_distribution=dict(driver_counts),
            data_status=settings.DATA_STATUS,
        )

    def get_project_risk(self, project_code: str) -> RiskPrediction:
        p = repository.get_project_by_code(project_code)
        if not p:
            raise ProjectNotFoundError(project_code)

        # Build drivers list
        top_driver = p.get("top_risk_driver", "schedule_progress_gap_pct")
        drivers = [
            DriverImpact(feature=top_driver, impact=round(p["overall_risk_score"] * 0.45, 2), value=p.get("schedule_progress_gap_pct")),
            DriverImpact(feature="expenditure_burn_rate", impact=round(p["overall_risk_score"] * 0.28, 2), value=p.get("cumulative_expenditure_cr")),
            DriverImpact(feature="elapsed_duration_pct", impact=round(p["overall_risk_score"] * 0.18, 2), value=p.get("elapsed_duration_pct")),
        ]

        what_changed = {
            "risk_delta": p.get("risk_delta", 0.0),
            "progress_change_pct": 0.0,
            "expenditure_change_cr": 0.0,
            "summary": f"Risk trajectory is {p.get('risk_trajectory', 'STABLE')} with delta {p.get('risk_delta', 0.0):+.1f}."
        }

        return RiskPrediction(
            project_code=p["project_code"],
            prediction_timestamp=p.get("latest_report_date", "2026-07-01"),
            schedule_delay_probability=float(p.get("schedule_delay_probability", 0.0)),
            cost_overrun_probability=float(p.get("cost_overrun_probability", 0.0)),
            overall_risk_score=float(p.get("overall_risk_score", 0.0)),
            risk_level=p.get("risk_level", RiskLevelEnum.LOW),
            risk_trajectory=p.get("risk_trajectory", RiskTrajectoryEnum.STABLE),
            risk_delta=float(p.get("risk_delta", 0.0)),
            anomaly_status=p.get("anomaly_status", AnomalyStatusEnum.NORMAL),
            intervention_priority=p.get("intervention_priority", InterventionPriorityEnum.LOW),
            top_risk_drivers=drivers,
            what_changed_since_last_month=what_changed,
            data_status=settings.DATA_STATUS,
        )


risk_service = RiskService()
