"""
backend.app.services.project_service - Business logic for project queries, details, and history.
"""

from typing import List, Optional, Tuple
from backend.app.core.errors import ProjectNotFoundError
from backend.app.repositories.project_repository import repository
from backend.app.schemas.project import ProjectSummary, ProjectDetail, ProjectHistoryItem
from backend.app.schemas.common import PaginationMeta, PaginatedResponse


class ProjectService:

    def get_projects(
        self,
        page: int = 1,
        page_size: int = 20,
        state: Optional[str] = None,
        risk_level: Optional[str] = None,
        delayed_only: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> PaginatedResponse[ProjectSummary]:
        items_raw, total_count = repository.get_all_projects(
            page=page,
            page_size=page_size,
            state=state,
            risk_level=risk_level,
            delayed_only=delayed_only,
            search=search,
        )

        summaries = [
            ProjectSummary(
                project_code=item["project_code"],
                project_name=item["project_name"],
                agency=item.get("agency"),
                state=item.get("state"),
                ministry=item.get("ministry"),
                sector=item.get("sector"),
                original_cost_cr=item["original_cost_cr"],
                cumulative_expenditure_cr=item["cumulative_expenditure_cr"],
                physical_progress_pct=item["physical_progress_pct"],
                status=item["status"],
                overall_risk_score=item["overall_risk_score"],
                risk_level=item["risk_level"],
                time_overrun_days=item["time_overrun_days"],
                time_overrun_flag=item["time_overrun_flag"],
                latest_report_date=item["latest_report_date"],
            )
            for item in items_raw
        ]

        total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
        pagination = PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=total_count,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )

        return PaginatedResponse(items=summaries, pagination=pagination)

    def get_project_detail(self, project_code: str) -> ProjectDetail:
        item = repository.get_project_by_code(project_code)
        if not item:
            raise ProjectNotFoundError(project_code)

        return ProjectDetail(**item)

    def get_project_history(self, project_code: str) -> List[ProjectHistoryItem]:
        item = repository.get_project_by_code(project_code)
        if not item:
            raise ProjectNotFoundError(project_code)

        raw_history = repository.get_project_history(project_code)
        return [
            ProjectHistoryItem(
                report_date=h["report_date"],
                report_year=int(h["report_year"]),
                report_month_num=int(h["report_month_num"]),
                original_cost_cr=float(h.get("original_cost_cr", 0.0)),
                cumulative_expenditure_cr=float(h.get("cumulative_expenditure_cr", 0.0)),
                physical_progress_pct=float(h.get("physical_progress_pct", 0.0)),
                elapsed_duration_pct=float(h.get("elapsed_duration_pct", 0.0)),
                schedule_progress_gap_pct=float(h.get("schedule_progress_gap_pct", 0.0)),
                time_overrun_days=float(h.get("time_overrun_days", 0.0)),
                time_overrun_months=float(h.get("time_overrun_months", 0.0)),
                time_overrun_flag=int(h.get("time_overrun_flag", 0)),
            )
            for h in raw_history
        ]


project_service = ProjectService()
