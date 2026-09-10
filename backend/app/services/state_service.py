"""
backend.app.services.state_service - State-level aggregation and map statistics service.
"""

from typing import List, Dict
from collections import Counter
from backend.app.core.errors import StateNotFoundError
from backend.app.core.state_names import normalize_state_name
from backend.app.repositories.project_repository import repository
from backend.app.schemas.state import StateStats, StateSummary, AgencyDistributionItem
from backend.app.schemas.project import ProjectSummary
from backend.app.schemas.common import RiskLevelEnum


class StateService:

    def get_all_state_summaries(self) -> List[StateSummary]:
        states = repository.get_all_states()
        summaries = []

        for st in states:
            projects = repository.get_projects_for_state(st)
            total = len(projects)
            if total == 0:
                continue

            high_count = sum(1 for p in projects if p["risk_level"] == "HIGH")
            crit_count = sum(1 for p in projects if p["risk_level"] == "CRITICAL")
            delayed_count = sum(1 for p in projects if p.get("time_overrun_flag") == 1)
            avg_risk = round(sum(p["overall_risk_score"] for p in projects) / total, 1)

            if avg_risk >= 75:
                dom_level = RiskLevelEnum.CRITICAL
            elif avg_risk >= 50:
                dom_level = RiskLevelEnum.HIGH
            elif avg_risk >= 25:
                dom_level = RiskLevelEnum.MEDIUM
            else:
                dom_level = RiskLevelEnum.LOW

            summaries.append(
                StateSummary(
                    state_name=st,
                    total_projects=total,
                    high_risk_projects=high_count,
                    critical_risk_projects=crit_count,
                    delayed_projects=delayed_count,
                    average_risk_score=avg_risk,
                    dominant_risk_level=dom_level,
                )
            )

        summaries.sort(key=lambda s: s.total_projects, reverse=True)
        return summaries

    def get_state_stats(self, state_name: str) -> StateStats:
        canonical = normalize_state_name(state_name)
        projects = repository.get_projects_for_state(canonical)

        if not projects:
            raise StateNotFoundError(canonical or state_name)

        total = len(projects)
        high_count = sum(1 for p in projects if p["risk_level"] == "HIGH")
        crit_count = sum(1 for p in projects if p["risk_level"] == "CRITICAL")
        cost_count = sum(1 for p in projects if float(p.get("cost_overrun_probability", 0.0)) >= 0.5)
        time_count = sum(1 for p in projects if int(p.get("time_overrun_flag", 0)) == 1)
        avg_risk = round(sum(p["overall_risk_score"] for p in projects) / total, 1)

        if avg_risk >= 75:
            dom_level = RiskLevelEnum.CRITICAL
        elif avg_risk >= 50:
            dom_level = RiskLevelEnum.HIGH
        elif avg_risk >= 25:
            dom_level = RiskLevelEnum.MEDIUM
        else:
            dom_level = RiskLevelEnum.LOW

        # Agency distribution
        agency_counts = Counter(p.get("agency") or "Unknown" for p in projects)
        agency_items = [
            AgencyDistributionItem(agency=k, count=v)
            for k, v in agency_counts.most_common()
        ]

        # Top critical projects sorted by risk score descending
        sorted_projects = sorted(projects, key=lambda p: p["overall_risk_score"], reverse=True)
        top_critical = [
            ProjectSummary(
                project_code=p["project_code"],
                project_name=p["project_name"],
                agency=p.get("agency"),
                state=p.get("state"),
                ministry=p.get("ministry"),
                sector=p.get("sector"),
                original_cost_cr=p["original_cost_cr"],
                cumulative_expenditure_cr=p["cumulative_expenditure_cr"],
                physical_progress_pct=p["physical_progress_pct"],
                status=p["status"],
                overall_risk_score=p["overall_risk_score"],
                risk_level=p["risk_level"],
                time_overrun_days=p["time_overrun_days"],
                time_overrun_flag=p["time_overrun_flag"],
                latest_report_date=p["latest_report_date"],
            )
            for p in sorted_projects[:5]
        ]

        return StateStats(
            state_name=canonical,
            total_projects=total,
            high_risk_projects=high_count,
            critical_risk_projects=crit_count,
            cost_risk_projects=cost_count,
            time_risk_projects=time_count,
            average_risk=avg_risk,
            risk_level=dom_level,
            agency_distribution=agency_items,
            top_critical_projects=top_critical,
        )


state_service = StateService()
