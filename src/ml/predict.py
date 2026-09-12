"""
src/ml/predict.py - Production-Ready Inference Engine for Batch & Real-time Serving
Supports current unseen April–July 2026 inference and generates schema-validated JSON outputs
for future FastAPI backend endpoints and dashboard integration.
"""

import os
import sys

# Ensure repository root is in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Auto-delegate to repository's .venv if invoked by an external/system python
venv_python = os.path.join(REPO_ROOT, ".venv", "Scripts", "python.exe") if os.name == "nt" else os.path.join(REPO_ROOT, ".venv", "bin", "python")
if os.path.exists(venv_python):
    if os.path.abspath(sys.executable).lower() != os.path.abspath(venv_python).lower():
        import subprocess
        res = subprocess.run([venv_python] + sys.argv, cwd=REPO_ROOT)
        sys.exit(res.returncode)

import json
import pickle
from datetime import datetime
from typing import Dict, Any, List, Union

import numpy as np
import pandas as pd

from src.ml.feature_pipeline import prepare_features, split_temporal_data, load_config
from src.ml.anomaly_detection import score_anomalies
from src.ml.risk_scoring import (
    compute_overall_risk_score, categorize_risk_level,
    compute_risk_trajectory, compute_what_changed, compute_intervention_priority
)
from src.ml.explain import ModelExplainer
from src.mlops.model_metadata import DATA_STATUS


class PAIMANAPredictor:
    """Production Inference Service loaded with registered model artifacts."""

    def __init__(self, config_path: str = "configs/model_params.yaml"):
        self.config = load_config(config_path)
        models_dir = self.config.get("paths", {}).get("models_dir", "models")

        delay_path = os.path.join(models_dir, "schedule_delay", "production_model.pkl")
        cost_path = os.path.join(models_dir, "cost_overrun", "production_model.pkl")
        anomaly_path = os.path.join(models_dir, "anomaly_detector", "production_anomaly_detector.pkl")

        if not os.path.exists(delay_path) or not os.path.exists(cost_path) or not os.path.exists(anomaly_path):
            raise FileNotFoundError("One or more required production model artifacts are missing. Run training first.")

        with open(delay_path, "rb") as f:
            self.delay_pkg = pickle.load(f)
        with open(cost_path, "rb") as f:
            self.cost_pkg = pickle.load(f)
        with open(anomaly_path, "rb") as f:
            self.anomaly_pkg = pickle.load(f)

        # Initialize SHAP Explainer on winning delay model
        self.delay_explainer = ModelExplainer(delay_path)

    def predict_single(self,
                       current_row: pd.Series,
                       prev_row: pd.Series = None) -> Dict[str, Any]:
        """Generate schema-conforming prediction dictionary for a single project observation."""
        instance_df = pd.DataFrame([current_row])

        # 1. Model Probabilities
        delay_feat = self.delay_pkg["feature_cols"]
        cost_feat = self.cost_pkg["feature_cols"]

        p_delay = float(self.delay_pkg["pipeline"].predict_proba(instance_df[delay_feat])[:, 1][0])
        p_cost = float(self.cost_pkg["pipeline"].predict_proba(instance_df[cost_feat])[:, 1][0])

        # 2. Anomaly Sentinel Scoring
        _, anom_cats = score_anomalies(instance_df, self.anomaly_pkg, self.config)
        anomaly_status = anom_cats[0]

        # 3. Overall Risk Score
        gap_pct = float(current_row.get("schedule_progress_gap_pct", 0.0))
        risk_score = compute_overall_risk_score(p_delay, p_cost, gap_pct, anomaly_status, self.config)
        risk_level = categorize_risk_level(risk_score)

        # 4. Trajectory & What Changed
        prev_risk = None
        if prev_row is not None:
            # Estimate previous risk score from previous row
            prev_gap = float(prev_row.get("schedule_progress_gap_pct", 0.0))
            prev_instance = pd.DataFrame([prev_row])
            p_delay_prev = float(self.delay_pkg["pipeline"].predict_proba(prev_instance[delay_feat])[:, 1][0])
            p_cost_prev = float(self.cost_pkg["pipeline"].predict_proba(prev_instance[cost_feat])[:, 1][0])
            _, anom_prev_cats = score_anomalies(prev_instance, self.anomaly_pkg, self.config)
            prev_risk = compute_overall_risk_score(p_delay_prev, p_cost_prev, prev_gap, anom_prev_cats[0], self.config)

        trajectory_info = compute_risk_trajectory(risk_score, prev_risk, self.config)
        what_changed = compute_what_changed(current_row.to_dict(), prev_row.to_dict() if prev_row is not None else None)

        # 5. Intervention Priority
        orig_cost = float(current_row.get("original_cost_cr", 100.0))
        priority_info = compute_intervention_priority(risk_score, orig_cost, trajectory_info["risk_velocity"], self.config)

        # 6. SHAP Explanations
        xai_res = self.delay_explainer.explain_instance(instance_df, top_k=4)

        pred_timestamp = datetime.now().isoformat()
        if "report_date" in current_row and pd.notna(current_row["report_date"]):
            pred_timestamp = str(current_row["report_date"])

        output = {
            "project_code": str(current_row.get("project_code", "UNKNOWN")),
            "prediction_timestamp": pred_timestamp,
            "schedule_delay_probability": round(p_delay, 4),
            "cost_overrun_probability": round(p_cost, 4),
            "overall_risk_score": risk_score,
            "risk_level": risk_level,
            "risk_trajectory": trajectory_info["risk_trajectory"],
            "risk_delta": trajectory_info["risk_delta"],
            "anomaly_status": anomaly_status,
            "intervention_priority": priority_info["intervention_priority_tier"],
            "top_risk_drivers": xai_res["top_risk_drivers"],
            "what_changed_since_last_month": what_changed,
            "data_status": DATA_STATUS
        }

        return output

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Run high-performance vectorized batch inference across multiple project records."""
        df_sorted = df.sort_values(by=["project_code", "report_date"]).reset_index(drop=True)

        # 1. Vectorized Model Probabilities
        delay_feat = self.delay_pkg["feature_cols"]
        cost_feat = self.cost_pkg["feature_cols"]
        p_delay = self.delay_pkg["pipeline"].predict_proba(df_sorted[delay_feat])[:, 1]
        p_cost = self.cost_pkg["pipeline"].predict_proba(df_sorted[cost_feat])[:, 1]

        # 2. Vectorized Anomaly Scoring
        _, anom_cats = score_anomalies(df_sorted, self.anomaly_pkg, self.config)

        # 3. Vectorized Overall Risk Score
        weights = self.config.get("risk_scoring", {}).get("weights", {})
        w_delay = weights.get("schedule_delay_prob", 0.40)
        w_cost = weights.get("cost_overrun_prob", 0.35)
        w_gap = weights.get("schedule_progress_gap", 0.15)
        w_anom = weights.get("anomaly_penalty", 0.10)

        gap_pct = df_sorted["schedule_progress_gap_pct"].fillna(0.0).values
        norm_gap = np.clip(-gap_pct / 50.0, 0.0, 1.0)

        anom_penalties = {"NORMAL": 0.0, "UNUSUAL": 0.33, "ANOMALOUS": 0.66, "REQUIRES_VERIFICATION": 1.0}
        anom_factors = np.array([anom_penalties.get(str(c).upper(), 0.0) for c in anom_cats])

        raw_scores = 100.0 * ((w_delay * p_delay) + (w_cost * p_cost) + (w_gap * norm_gap) + (w_anom * anom_factors))
        risk_scores = np.clip(np.round(raw_scores, 1), 0.0, 100.0)

        df_sorted["overall_risk_score"] = risk_scores
        df_sorted["risk_level"] = [categorize_risk_level(s) for s in risk_scores]

        # 4. Trajectory Tracking via Lag Shift
        prev_risk = df_sorted.groupby("project_code")["overall_risk_score"].shift(1)
        risk_deltas = np.round((df_sorted["overall_risk_score"] - prev_risk).fillna(0.0).values, 1)

        trajectories = []
        for d in risk_deltas:
            if d >= 10.0:
                trajectories.append("RAPID_ESCALATION")
            elif d >= 5.0:
                trajectories.append("MODERATE_RISE")
            elif d <= -5.0:
                trajectories.append("DE_ESCALATING")
            else:
                trajectories.append("STABLE")

        # 5. Intervention Priority
        orig_costs = df_sorted["original_cost_cr"].fillna(100.0).values
        f_risk = risk_scores / 100.0
        f_impact = np.clip(np.log10(np.maximum(orig_costs, 10.0) / 10.0) / 3.7, 0.1, 1.0)
        f_urgency = np.clip(0.5 + (risk_deltas / 20.0), 0.1, 1.0)

        w_p = self.config.get("intervention_priority", {}).get("weights", {})
        p_idx = 100.0 * ((w_p.get("risk_score", 0.50) * f_risk) + (w_p.get("cost_impact", 0.30) * f_impact) + (w_p.get("urgency", 0.20) * f_urgency))
        p_idx = np.clip(np.round(p_idx, 1), 0.0, 100.0)

        p_tiers = []
        for p in p_idx:
            if p < 30.0:
                p_tiers.append("LOW")
            elif p < 55.0:
                p_tiers.append("MEDIUM")
            elif p < 75.0:
                p_tiers.append("HIGH")
            else:
                p_tiers.append("CRITICAL_INTERVENTION")

        out_df = pd.DataFrame({
            "project_code": df_sorted["project_code"].astype(str),
            "prediction_timestamp": df_sorted["report_date"].astype(str),
            "schedule_delay_probability": np.round(p_delay, 4),
            "cost_overrun_probability": np.round(p_cost, 4),
            "overall_risk_score": risk_scores,
            "risk_level": df_sorted["risk_level"],
            "risk_trajectory": trajectories,
            "risk_delta": risk_deltas,
            "anomaly_status": anom_cats,
            "intervention_priority": p_tiers,
            "intervention_index": p_idx,
            "top_risk_driver": "schedule_progress_gap_pct"
        })

        return out_df


def run_current_data_inference(config_path: str = "configs/model_params.yaml") -> dict:
    """
    Execute inference on the Unseen Current 4-Month dataset (April–July 2026, 6,228 records).
    Saves predictions for dashboard and API integration.
    """
    config = load_config(config_path)
    predictor = PAIMANAPredictor(config_path)

    print("[INFERENCE] Loading feature dataset and partitioning current 4-month data...")
    df = prepare_features(config.get("paths", {}).get("ml_ready_features"), config_path)
    splits = split_temporal_data(df, config_path)
    current_df = splits["current"]

    print(f"[INFERENCE] Running batch prediction on {len(current_df):,} current April-July 2026 records...")
    preds_df = predictor.predict_batch(current_df)

    out_csv_reports = "reports/current_data_predictions.csv"
    out_csv_data = "data/processed/paimana_current_data_predictions.csv"
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    preds_df.to_csv(out_csv_reports, index=False)
    preds_df.to_csv(out_csv_data, index=False)
    print(f"[INFERENCE] Saved current predictions to {out_csv_reports} and {out_csv_data}")

    # Generate summary statistics for reporting
    summary = {
        "total_inferred_observations": len(preds_df),
        "unique_projects": int(preds_df["project_code"].nunique()),
        "risk_level_distribution": preds_df["risk_level"].value_counts().to_dict(),
        "risk_trajectory_distribution": preds_df["risk_trajectory"].value_counts().to_dict(),
        "anomaly_distribution": preds_df["anomaly_status"].value_counts().to_dict(),
        "intervention_priority_distribution": preds_df["intervention_priority"].value_counts().to_dict(),
        "mean_risk_score": float(round(preds_df["overall_risk_score"].mean(), 2)),
        "high_or_critical_risk_count": int((preds_df["risk_level"].isin(["HIGH", "CRITICAL"])).sum()),
        "rapid_escalation_count": int((preds_df["risk_trajectory"] == "RAPID_ESCALATION").sum()),
        "requires_verification_count": int((preds_df["anomaly_status"] == "REQUIRES_VERIFICATION").sum())
    }

    return summary


if __name__ == "__main__":
    summary = run_current_data_inference()
    print("\n--- Current Data Inference Summary ---")
    print(json.dumps(summary, indent=2))
