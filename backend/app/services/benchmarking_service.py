"""
backend.app.services.benchmarking_service - Cross-state, agency, and national benchmarking logic.
"""

from typing import Optional
from backend.app.core.errors import ProjectNotFoundError
from backend.app.repositories.project_repository import repository
from backend.app.schemas.benchmarking import BenchmarkingResult


class BenchmarkingService:

    def get_benchmarking(self, project_code: str) -> BenchmarkingResult:
        p = repository.get_project_by_code(project_code)
        if not p:
            raise ProjectNotFoundError(project_code)

        all_projects, _ = repository.get_all_projects(page=1, page_size=repository.total_projects)
        total_nat = len(all_projects)
        nat_avg_risk = round(sum(item["overall_risk_score"] for item in all_projects) / total_nat, 1)
        nat_avg_prog = round(sum(item["physical_progress_pct"] for item in all_projects) / total_nat, 1)

        # State benchmark
        st = p.get("state")
        if st:
            state_projects = repository.get_projects_for_state(st)
            n_st = len(state_projects)
            st_avg_risk = round(sum(item["overall_risk_score"] for item in state_projects) / n_st, 1) if n_st > 0 else nat_avg_risk
            st_avg_prog = round(sum(item["physical_progress_pct"] for item in state_projects) / n_st, 1) if n_st > 0 else nat_avg_prog
            # Percentile rank
            lower_count = sum(1 for item in state_projects if item["overall_risk_score"] < p["overall_risk_score"])
            pct_rank = round((lower_count / n_st) * 100.0, 1) if n_st > 0 else 50.0
        else:
            st_avg_risk = nat_avg_risk
            st_avg_prog = nat_avg_prog
            pct_rank = 50.0

        # Agency benchmark
        agency = p.get("agency")
        if agency:
            agency_projects = [item for item in all_projects if item.get("agency") == agency]
            n_agn = len(agency_projects)
            agn_avg_risk = round(sum(item["overall_risk_score"] for item in agency_projects) / n_agn, 1) if n_agn > 0 else None
            agn_avg_prog = round(sum(item["physical_progress_pct"] for item in agency_projects) / n_agn, 1) if n_agn > 0 else None
        else:
            agn_avg_risk = None
            agn_avg_prog = None

        return BenchmarkingResult(
            project_code=p["project_code"],
            project_name=p["project_name"],
            project_risk_score=p["overall_risk_score"],
            project_progress_pct=p["physical_progress_pct"],
            state_name=st,
            state_average_risk=st_avg_risk,
            state_average_progress=st_avg_prog,
            portfolio_average_risk=nat_avg_risk,
            portfolio_average_progress=nat_avg_prog,
            agency=agency,
            agency_average_risk=agn_avg_risk,
            agency_average_progress=agn_avg_prog,
            risk_percentile_in_state=pct_rank,
        )


benchmarking_service = BenchmarkingService()
