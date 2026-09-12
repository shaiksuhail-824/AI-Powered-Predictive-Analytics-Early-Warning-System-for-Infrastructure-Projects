"""
backend.app.services.alert_service - Dynamic Early-Warning Alerts & Escalation Generation.
Extracts real-time risk alerts from critical-risk projects, rapid escalations, and anomaly detections.
"""

from typing import List, Optional
from backend.app.repositories.project_repository import repository
from backend.app.schemas.alert import AlertItem, AlertListResponse, AlertSeverityEnum, AlertStatusEnum


class AlertService:

    def get_alerts(self, severity: Optional[AlertSeverityEnum] = None, limit: int = 50) -> AlertListResponse:
        projects, _ = repository.get_all_projects(page=1, page_size=repository.total_projects)
        alerts: List[AlertItem] = []

        for p in projects:
            code = p["project_code"]
            name = p.get("project_name", f"Project {code}")
            score = p["overall_risk_score"]
            traj = p.get("risk_trajectory", "STABLE")
            anom = p.get("anomaly_status", "NORMAL")
            delta = p.get("risk_delta", 0.0)

            # 1. Critical risk alert
            if score >= 75:
                alerts.append(
                    AlertItem(
                        alert_id=f"ALT-CRIT-{code}",
                        project_code=code,
                        project_name=name,
                        severity=AlertSeverityEnum.CRITICAL,
                        alert_type="CRITICAL_RISK",
                        message=f"Project is in CRITICAL risk tier ({score:.1f}/100) with severe schedule/cost gap.",
                        state=p.get("state"),
                        agency=p.get("agency"),
                        risk_score=score,
                        status=AlertStatusEnum.NEW,
                        created_at=p.get("latest_report_date", "2026-07-01"),
                    )
                )
            # 2. Rapid escalation alert
            elif traj == "RAPID_ESCALATION" or delta >= 10.0:
                alerts.append(
                    AlertItem(
                        alert_id=f"ALT-ESCAL-{code}",
                        project_code=code,
                        project_name=name,
                        severity=AlertSeverityEnum.HIGH,
                        alert_type="RAPID_ESCALATION",
                        message=f"Rapid month-over-month risk escalation detected (delta: +{delta:.1f}).",
                        state=p.get("state"),
                        agency=p.get("agency"),
                        risk_score=score,
                        status=AlertStatusEnum.NEW,
                        created_at=p.get("latest_report_date", "2026-07-01"),
                    )
                )
            # 3. Anomaly reporting alert
            elif anom in ["ANOMALOUS", "REQUIRES_VERIFICATION"]:
                alerts.append(
                    AlertItem(
                        alert_id=f"ALT-ANOM-{code}",
                        project_code=code,
                        project_name=name,
                        severity=AlertSeverityEnum.MEDIUM if score < 50 else AlertSeverityEnum.HIGH,
                        alert_type="ANOMALY_REPORTING",
                        message=f"Data integrity sentinel classified project as {anom}. Financial vs physical divergence.",
                        state=p.get("state"),
                        agency=p.get("agency"),
                        risk_score=score,
                        status=AlertStatusEnum.NEW,
                        created_at=p.get("latest_report_date", "2026-07-01"),
                    )
                )

        # Filter by severity if requested
        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        # Sort: Critical first, then by risk score descending
        severity_order = {AlertSeverityEnum.CRITICAL: 0, AlertSeverityEnum.HIGH: 1, AlertSeverityEnum.MEDIUM: 2}
        alerts.sort(key=lambda a: (severity_order.get(a.severity, 3), -a.risk_score))

        crit_count = sum(1 for a in alerts if a.severity == AlertSeverityEnum.CRITICAL)
        high_count = sum(1 for a in alerts if a.severity == AlertSeverityEnum.HIGH)
        med_count = sum(1 for a in alerts if a.severity == AlertSeverityEnum.MEDIUM)

        return AlertListResponse(
            total_alerts=len(alerts),
            critical_count=crit_count,
            high_count=high_count,
            medium_count=med_count,
            alerts=alerts[:limit],
        )


alert_service = AlertService()
