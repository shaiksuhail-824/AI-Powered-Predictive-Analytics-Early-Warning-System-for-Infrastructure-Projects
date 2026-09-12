"""
backend.app.repositories.project_repository - High-Performance In-Memory Indexed Data Access Layer.
Loads repository processed observations, predictions, and metadata into memory on startup.
Provides sub-millisecond query performance across 3,531 central infrastructure projects.
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd
import numpy as np

from backend.app.core.config import settings
from backend.app.core.state_names import normalize_state_name
from backend.app.schemas.common import (
    RiskLevelEnum,
    RiskTrajectoryEnum,
    ProjectStatusEnum,
    AnomalyStatusEnum,
    InterventionPriorityEnum,
)


def _compute_status(risk_level: str, time_overrun_flag: int, progress_pct: float) -> ProjectStatusEnum:
    """Derive standardized operational status from ground-truth risk and delay flags."""
    if risk_level == "CRITICAL":
        return ProjectStatusEnum.CRITICAL
    if time_overrun_flag == 1 or risk_level == "HIGH":
        return ProjectStatusEnum.DELAYED
    if risk_level == "MEDIUM" or progress_pct < 20.0:
        return ProjectStatusEnum.WATCH
    return ProjectStatusEnum.ON_TRACK


class ProjectRepository:
    """Thread-safe, high-speed in-memory indexed repository for PAIMANA project data."""

    def __init__(self):
        self._is_loaded = False
        self._df_processed: pd.DataFrame = pd.DataFrame()
        self._df_predictions: pd.DataFrame = pd.DataFrame()
        self._df_metadata: pd.DataFrame = pd.DataFrame()

        # Fast lookup indices
        self._latest_projects_list: List[Dict[str, Any]] = []
        self._latest_by_code: Dict[str, Dict[str, Any]] = {}
        self._history_by_code: Dict[str, List[Dict[str, Any]]] = {}
        self._projects_by_state: Dict[str, List[str]] = {}
        self._unique_states: List[str] = []

    def load_data(self) -> None:
        """Load datasets from disk and construct in-memory indices."""
        proc_path = settings.DATA_PROCESSED_PATH
        pred_path = settings.CURRENT_PREDICTIONS_PATH
        meta_path = settings.METADATA_PATH

        if not proc_path.exists():
            raise FileNotFoundError(f"Authoritative processed dataset not found at {proc_path}")

        # 1. Load Processed Longitudinal Data (17,697 records)
        self._df_processed = pd.read_csv(proc_path, dtype={"project_code": str}, low_memory=False)
        self._df_processed["report_date"] = pd.to_datetime(self._df_processed["report_date"]).dt.strftime("%Y-%m-%d")

        # 2. Load Predictions if available (6,228 records)
        if pred_path.exists():
            self._df_predictions = pd.read_csv(pred_path, dtype={"project_code": str}, low_memory=False)
            self._df_predictions["prediction_timestamp"] = pd.to_datetime(self._df_predictions["prediction_timestamp"]).dt.strftime("%Y-%m-%d")
        else:
            self._df_predictions = pd.DataFrame()

        # 3. Load Metadata if available (3,933 records)
        if meta_path.exists():
            self._df_metadata = pd.read_csv(meta_path, dtype={"project_code": str}, low_memory=False)
        else:
            self._df_metadata = pd.DataFrame()

        self._build_indices()
        self._is_loaded = True
        print(f"[REPOSITORY] Successfully indexed {len(self._latest_projects_list)} projects across {len(self._df_processed)} observation records.")

    def _build_indices(self) -> None:
        """Construct dictionary and list indices for sub-millisecond retrieval."""
        # Index metadata by project_code
        meta_dict: Dict[str, Dict[str, Any]] = {}
        if not self._df_metadata.empty:
            for _, row in self._df_metadata.iterrows():
                code = str(row["project_code"]).strip()
                meta_dict[code] = {
                    "project_name": str(row["project_name"]) if pd.notna(row.get("project_name")) else f"Project {code}",
                    "agency": str(row["agency"]) if pd.notna(row.get("agency")) else None,
                    "state": normalize_state_name(str(row["state"])) if pd.notna(row.get("state")) else "Multi-State",
                    "approval_date": str(row["approval_date_dt"])[:10] if pd.notna(row.get("approval_date_dt")) else None,
                    "start_date": str(row["start_date_dt"])[:10] if pd.notna(row.get("start_date_dt")) else None,
                    "original_doc": str(row["original_doc_dt"])[:10] if pd.notna(row.get("original_doc_dt")) else None,
                    "revised_doc": str(row["revised_doc_dt"])[:10] if pd.notna(row.get("revised_doc_dt")) else None,
                    "revised_cost_cr": float(row["revised_cost_cr"]) if pd.notna(row.get("revised_cost_cr")) else None,
                }

        # Index latest prediction by project_code (sort by prediction_timestamp desc)
        latest_pred_dict: Dict[str, Dict[str, Any]] = {}
        if not self._df_predictions.empty:
            df_pred_sorted = self._df_predictions.sort_values(by=["project_code", "prediction_timestamp"])
            for _, row in df_pred_sorted.iterrows():
                code = str(row["project_code"]).strip()
                latest_pred_dict[code] = {
                    "schedule_delay_probability": float(row.get("schedule_delay_probability", 0.0)),
                    "cost_overrun_probability": float(row.get("cost_overrun_probability", 0.0)),
                    "overall_risk_score": float(row.get("overall_risk_score", 0.0)),
                    "risk_level": str(row.get("risk_level", "LOW")).upper(),
                    "risk_trajectory": str(row.get("risk_trajectory", "STABLE")).upper(),
                    "risk_delta": float(row.get("risk_delta", 0.0)),
                    "anomaly_status": str(row.get("anomaly_status", "NORMAL")).upper(),
                    "intervention_priority": str(row.get("intervention_priority", "LOW")).upper(),
                    "top_risk_driver": str(row.get("top_risk_driver", "schedule_progress_gap_pct")),
                    "prediction_timestamp": str(row.get("prediction_timestamp", "")),
                }

        # Sort processed dataframe by project_code and report_date
        df_sorted = self._df_processed.sort_values(by=["project_code", "report_date"]).reset_index(drop=True)

        self._history_by_code.clear()
        self._latest_by_code.clear()
        self._latest_projects_list.clear()
        self._projects_by_state.clear()

        # Group by project_code for time-series extraction
        for code, group in df_sorted.groupby("project_code"):
            code_str = str(code).strip()
            records = group.to_dict(orient="records")
            self._history_by_code[code_str] = records

            # Latest observation record
            latest_obs = records[-1]
            meta = meta_dict.get(code_str, {
                "project_name": f"Project {code_str}",
                "agency": None,
                "state": "Multi-State",
                "approval_date": None,
                "start_date": None,
                "original_doc": None,
                "revised_doc": None,
                "revised_cost_cr": None,
            })

            # Check if current prediction exists; if not, estimate from latest observation
            pred = latest_pred_dict.get(code_str)
            if pred is None:
                # Approximate baseline risk score from ground-truth delay/cost metrics
                time_flag = int(latest_obs.get("time_overrun_flag", 0))
                overrun_days = float(latest_obs.get("time_overrun_days", 0.0))
                gap = float(latest_obs.get("schedule_progress_gap_pct", 0.0))
                calc_score = 70.0 if time_flag == 1 else (40.0 if gap < -20.0 else 20.0)
                risk_lvl = "CRITICAL" if calc_score >= 75 else ("HIGH" if calc_score >= 50 else ("MEDIUM" if calc_score >= 25 else "LOW"))
                pred = {
                    "schedule_delay_probability": 0.85 if time_flag == 1 else 0.20,
                    "cost_overrun_probability": 0.50 if float(latest_obs.get("cumulative_expenditure_cr", 0.0)) > float(latest_obs.get("original_cost_cr", 1.0)) else 0.20,
                    "overall_risk_score": calc_score,
                    "risk_level": risk_lvl,
                    "risk_trajectory": "STABLE",
                    "risk_delta": 0.0,
                    "anomaly_status": "NORMAL",
                    "intervention_priority": "HIGH" if risk_lvl in ["HIGH", "CRITICAL"] else "LOW",
                    "top_risk_driver": "schedule_progress_gap_pct",
                    "prediction_timestamp": str(latest_obs.get("report_date", "")),
                }

            r_level = pred["risk_level"]
            t_flag = int(latest_obs.get("time_overrun_flag", 0))
            prog_pct = float(latest_obs.get("physical_progress_pct", 0.0))
            op_status = _compute_status(r_level, t_flag, prog_pct)

            combined: Dict[str, Any] = {
                "project_code": code_str,
                "project_name": meta["project_name"],
                "agency": meta["agency"],
                "state": meta["state"],
                "ministry": None,  # Not present in authoritative CUF
                "sector": None,    # Not present in authoritative CUF
                "original_cost_cr": float(latest_obs.get("original_cost_cr", 0.0)),
                "revised_cost_cr": meta["revised_cost_cr"],
                "cumulative_expenditure_cr": float(latest_obs.get("cumulative_expenditure_cr", 0.0)),
                "physical_progress_pct": prog_pct,
                "elapsed_duration_pct": float(latest_obs.get("elapsed_duration_pct", 0.0)),
                "schedule_progress_gap_pct": float(latest_obs.get("schedule_progress_gap_pct", 0.0)),
                "approval_to_start_days": float(latest_obs.get("approval_to_start_days", 0.0)),
                "planned_duration_days": float(latest_obs.get("planned_duration_days", 0.0)),
                "elapsed_duration_days": float(latest_obs.get("elapsed_duration_days", 0.0)),
                "time_overrun_days": float(latest_obs.get("time_overrun_days", 0.0)),
                "time_overrun_months": float(latest_obs.get("time_overrun_months", 0.0)),
                "time_overrun_flag": t_flag,
                "status": op_status,
                "overall_risk_score": pred["overall_risk_score"],
                "risk_level": r_level,
                "risk_trajectory": pred["risk_trajectory"],
                "risk_delta": pred["risk_delta"],
                "schedule_delay_probability": pred["schedule_delay_probability"],
                "cost_overrun_probability": pred["cost_overrun_probability"],
                "anomaly_status": pred["anomaly_status"],
                "intervention_priority": pred["intervention_priority"],
                "top_risk_driver": pred["top_risk_driver"],
                "latest_report_date": str(latest_obs.get("report_date", "")),
                "approval_date": meta["approval_date"],
                "start_date": meta["start_date"],
                "original_completion_date": meta["original_doc"],
                "revised_completion_date": meta["revised_doc"],
            }

            self._latest_by_code[code_str] = combined
            self._latest_projects_list.append(combined)

            # State index
            st = combined["state"]
            if st:
                if st not in self._projects_by_state:
                    self._projects_by_state[st] = []
                self._projects_by_state[st].append(code_str)

        self._unique_states = sorted(list(self._projects_by_state.keys()))

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @property
    def total_projects(self) -> int:
        return len(self._latest_projects_list)

    @property
    def total_observations(self) -> int:
        return len(self._df_processed)

    def get_project_by_code(self, project_code: str) -> Optional[Dict[str, Any]]:
        """Retrieve latest state of a project by official project_code string."""
        return self._latest_by_code.get(str(project_code).strip())

    def get_project_history(self, project_code: str) -> List[Dict[str, Any]]:
        """Retrieve chronological longitudinal observation sequence for a project."""
        return self._history_by_code.get(str(project_code).strip(), [])

    def get_all_projects(
        self,
        page: int = 1,
        page_size: int = 20,
        state: Optional[str] = None,
        risk_level: Optional[str] = None,
        delayed_only: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Filtered and paginated query across all projects."""
        filtered = self._latest_projects_list

        if state and state.lower() != "all":
            canonical_state = normalize_state_name(state).lower()
            filtered = [p for p in filtered if p.get("state") and p["state"].lower() == canonical_state]

        if risk_level and risk_level.lower() != "all":
            r_target = risk_level.upper()
            filtered = [p for p in filtered if p.get("risk_level") == r_target]

        if delayed_only is True:
            filtered = [p for p in filtered if p.get("time_overrun_flag") == 1]

        if search:
            query = search.strip().lower()
            filtered = [
                p for p in filtered
                if query in p["project_code"].lower()
                or query in (p.get("project_name") or "").lower()
                or query in (p.get("agency") or "").lower()
            ]

        total_items = len(filtered)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        items = filtered[start_idx:end_idx]

        return items, total_items

    def get_all_states(self) -> List[str]:
        """Return list of all indexed canonical state names."""
        return self._unique_states

    def get_projects_for_state(self, state_name: str) -> List[Dict[str, Any]]:
        """Get all latest project records belonging to a canonical state."""
        canonical = normalize_state_name(state_name)
        codes = self._projects_by_state.get(canonical, [])
        return [self._latest_by_code[c] for c in codes if c in self._latest_by_code]

    def get_portfolio_summary_metrics(self) -> Dict[str, Any]:
        """Compute portfolio-wide aggregates."""
        all_projects = self._latest_projects_list
        total = len(all_projects)
        if total == 0:
            return {
                "total_projects": 0,
                "high_risk": 0,
                "critical_risk": 0,
                "delayed": 0,
                "average_risk": 0.0,
                "risk_distribution": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
            }

        high_count = sum(1 for p in all_projects if p["risk_level"] == "HIGH")
        crit_count = sum(1 for p in all_projects if p["risk_level"] == "CRITICAL")
        med_count = sum(1 for p in all_projects if p["risk_level"] == "MEDIUM")
        low_count = sum(1 for p in all_projects if p["risk_level"] == "LOW")
        delayed_count = sum(1 for p in all_projects if p.get("time_overrun_flag") == 1)
        mean_risk = round(sum(p["overall_risk_score"] for p in all_projects) / total, 2)

        return {
            "total_projects": total,
            "high_risk": high_count,
            "critical_risk": crit_count,
            "delayed": delayed_count,
            "average_risk": mean_risk,
            "risk_distribution": {
                "LOW": low_count,
                "MEDIUM": med_count,
                "HIGH": high_count,
                "CRITICAL": crit_count,
            },
        }

    def get_portfolio_trend(self) -> List[Dict[str, Any]]:
        """Compute monthly portfolio risk trends from processed observations."""
        if self._df_processed.empty:
            return []

        trend_data = []
        df_sorted = self._df_processed.sort_values(by="report_date")
        for date_val, group in df_sorted.groupby("report_date"):
            m_str = str(date_val)[:7]
            n_obs = len(group)
            delayed = int((group["time_overrun_flag"] == 1).sum())
            delayed_pct = round((delayed / n_obs) * 100.0, 1) if n_obs > 0 else 0.0

            # Approximate monthly average risk based on time_overrun_flag and progress gap
            approx_risk = round(float(np.clip(
                (group["time_overrun_flag"] * 60.0) - (group["schedule_progress_gap_pct"].clip(upper=0.0) * 0.3),
                0.0, 100.0
            ).mean()), 1)

            trend_data.append({
                "month": m_str,
                "average_risk_score": approx_risk,
                "delayed_percentage": delayed_pct,
                "total_active_projects": n_obs,
            })

        return trend_data


# Global repository instance
repository = ProjectRepository()
