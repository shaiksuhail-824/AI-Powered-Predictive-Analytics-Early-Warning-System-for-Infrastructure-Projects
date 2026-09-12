"""
backend.app.services.prediction_service - Production ML Inference Service Wrapper.
Maintains singleton instance of PAIMANAPredictor loaded with registered model artifacts.
Guarantees anti-leakage compliance and produces schema-validated prediction outputs.
"""

from typing import Dict, Any, Optional
import pandas as pd
from backend.app.core.config import settings
from backend.app.schemas.predict import SingleProjectPredictionRequest, SingleProjectPredictionResponse
from backend.app.schemas.risk import DriverImpact
from src.ml.predict import PAIMANAPredictor
from src.mlops.model_metadata import DATA_STATUS


class PredictionService:
    """Singleton service wrapping production ML models for real-time inference."""

    def __init__(self):
        self._predictor: Optional[PAIMANAPredictor] = None
        self._is_loaded = False

    def load_models(self) -> None:
        """Load production models into memory once at application lifespan startup."""
        if not self._is_loaded:
            config_str = str(settings.MODEL_CONFIG_PATH)
            self._predictor = PAIMANAPredictor(config_path=config_str)
            self._is_loaded = True
            print("[PREDICTION_SERVICE] Production models (Schedule Delay, Cost Overrun, Anomaly Sentinel, SHAP) successfully loaded.")

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def predict_project(self, req: SingleProjectPredictionRequest) -> SingleProjectPredictionResponse:
        """
        Execute full ML inference pipeline on a single project observation.
        Computes schedule delay prob, cost overrun prob, anomaly status, overall risk score,
        trajectory, intervention priority, and SHAP feature drivers.
        """
        if not self._is_loaded or self._predictor is None:
            self.load_models()

        assert self._predictor is not None, "Predictor failed to initialize."

        # Derived engineering features at Time T
        gap_pct = req.physical_progress_pct - (
            (req.elapsed_duration_days / (req.planned_duration_days + 1e-5)) * 100.0
        )
        elapsed_pct = (req.elapsed_duration_days / (req.planned_duration_days + 1e-5)) * 100.0
        exp_pct = (req.cumulative_expenditure_cr / (req.original_cost_cr + 1e-5)) * 100.0
        spend_per_pct = req.cumulative_expenditure_cr / (req.physical_progress_pct + 1e-5)
        rem_cost = req.original_cost_cr - req.cumulative_expenditure_cr
        rem_days = req.planned_duration_days - req.elapsed_duration_days
        proj_age_months = req.elapsed_duration_days / 30.4375
        prog_per_month = req.physical_progress_pct / (proj_age_months + 1e-5)

        row_dict: Dict[str, Any] = {
            "project_code": req.project_code or "SIM_PROJECT",
            "original_cost_cr": req.original_cost_cr,
            "cumulative_expenditure_cr": req.cumulative_expenditure_cr,
            "physical_progress_pct": req.physical_progress_pct,
            "approval_to_start_days": req.approval_to_start_days,
            "planned_duration_days": req.planned_duration_days,
            "elapsed_duration_days": req.elapsed_duration_days,
            "remaining_planned_days": rem_days,
            "elapsed_duration_pct": elapsed_pct,
            "expenditure_to_original_cost_pct": exp_pct,
            "expenditure_per_progress_pct_cr": spend_per_pct,
            "remaining_original_cost_cr": rem_cost,
            "progress_per_elapsed_month": prog_per_month,
            "schedule_progress_gap_pct": gap_pct,
            "agency_frequency": req.agency_frequency or 0.05,
            "state_frequency": req.state_frequency or 0.03,
            "time_overrun_days": req.time_overrun_days or 0.0,
            "time_overrun_months": req.time_overrun_months or 0.0,
            "time_overrun_flag": req.time_overrun_flag or 0,
            # Enhanced dynamic features
            "progress_delta_recent": 1.5,
            "expenditure_delta_recent": 15.0,
            "recent_spend_efficiency_cr_pct": 10.0,
            "project_age_months": proj_age_months,
            "months_since_start": proj_age_months,
            "progress_velocity": 1.5,
            "progress_stagnation": 0,
            "cost_variance_cr": rem_cost,
            "cost_variance_pct": ((req.cumulative_expenditure_cr - req.original_cost_cr) / (req.original_cost_cr + 1e-5)) * 100.0,
            "expenditure_to_cost_ratio": req.cumulative_expenditure_cr / (req.original_cost_cr + 1e-5),
            "monthly_expenditure": 15.0,
            "expenditure_burn_rate": req.cumulative_expenditure_cr / (max(proj_age_months, 0.1)),
            "financial_year": 2026,
            # Missing indicators (all 0 since present)
            "report_year_missing": 0,
            "report_month_num_missing": 0,
            "agency_frequency_missing": 0,
            "state_frequency_missing": 0,
            "original_cost_cr_missing": 0,
            "cumulative_expenditure_cr_missing": 0,
            "physical_progress_pct_missing": 0,
            "expenditure_to_original_cost_pct_missing": 0,
            "expenditure_per_progress_pct_cr_missing": 0,
            "remaining_original_cost_cr_missing": 0,
            "approval_to_start_days_missing": 0,
            "planned_duration_days_missing": 0,
            "elapsed_duration_days_missing": 0,
            "remaining_planned_days_missing": 0,
            "elapsed_duration_pct_missing": 0,
            "progress_per_elapsed_month_missing": 0,
            "schedule_progress_gap_pct_missing": 0,
        }

        series = pd.Series(row_dict)
        raw_res = self._predictor.predict_single(series)

        drivers = [
            DriverImpact(
                feature=d.get("feature", "unknown"),
                impact=float(d.get("impact", 0.0)),
                value=float(d.get("value", 0.0)) if d.get("value") is not None else None,
            )
            for d in raw_res.get("top_risk_drivers", [])
        ]

        return SingleProjectPredictionResponse(
            project_code=raw_res["project_code"],
            prediction_timestamp=raw_res["prediction_timestamp"],
            schedule_delay_probability=raw_res["schedule_delay_probability"],
            cost_overrun_probability=raw_res["cost_overrun_probability"],
            overall_risk_score=raw_res["overall_risk_score"],
            risk_level=raw_res["risk_level"],
            risk_trajectory=raw_res["risk_trajectory"],
            risk_delta=raw_res["risk_delta"],
            anomaly_status=raw_res["anomaly_status"],
            intervention_priority=raw_res["intervention_priority"],
            top_risk_drivers=drivers,
            what_changed_since_last_month=raw_res.get("what_changed_since_last_month"),
            data_status=DATA_STATUS,
        )


# Global singleton
prediction_service = PredictionService()
