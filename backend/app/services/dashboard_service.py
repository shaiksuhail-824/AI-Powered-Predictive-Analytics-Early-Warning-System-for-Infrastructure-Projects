"""
backend.app.services.dashboard_service - Executive Dashboard Aggregate Service.
"""

from typing import List
from backend.app.core.config import settings
from backend.app.repositories.project_repository import repository
from backend.app.services.state_service import state_service
from backend.app.services.alert_service import alert_service
from backend.app.schemas.dashboard import DashboardOverview, RiskTrendItem
from backend.app.schemas.risk import RiskDistribution


class DashboardService:

    def get_dashboard_overview(self) -> DashboardOverview:
        metrics = repository.get_portfolio_summary_metrics()
        state_summaries = state_service.get_all_state_summaries()
        alert_resp = alert_service.get_alerts(limit=5)
        raw_trend = repository.get_portfolio_trend()

        trend_items = [
            RiskTrendItem(
                month=t["month"],
                average_risk_score=t["average_risk_score"],
                delayed_percentage=t["delayed_percentage"],
                total_active_projects=t["total_active_projects"],
            )
            for t in raw_trend
        ]

        return DashboardOverview(
            total_projects=metrics["total_projects"],
            high_risk_projects=metrics["high_risk"],
            critical_risk_projects=metrics["critical_risk"],
            delayed_projects=metrics["delayed"],
            average_risk_score=metrics["average_risk"],
            risk_distribution=RiskDistribution(**metrics["risk_distribution"]),
            state_summaries=state_summaries,
            recent_alerts=alert_resp.alerts,
            risk_trend=trend_items,
            data_status=settings.DATA_STATUS,
        )


dashboard_service = DashboardService()
