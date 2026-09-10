"""
src/ml/anomaly_detection.py - Project-Level Data Integrity & Anomaly Sentinel
Implements an unsupervised Isolation Forest sentinel to identify unusual observations in
expenditure, progress, cost, schedule, and spend efficiency.
Terminology strictly adheres to decision-support guidelines (Normal, Unusual, Anomalous, Requires verification)
and explicitly avoids labeling anomalies as proven fraud.
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

import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import IsolationForest

from src.ml.feature_pipeline import prepare_features, split_temporal_data, load_config

ANOMALY_FEATURE_COLUMNS = [
    "original_cost_cr",
    "cumulative_expenditure_cr",
    "physical_progress_pct",
    "schedule_progress_gap_pct",
    "elapsed_duration_pct",
    "progress_delta_recent",
    "expenditure_delta_recent",
    "recent_spend_efficiency_cr_pct",
    "expenditure_to_cost_ratio",
    "cost_variance_pct"
]


def build_anomaly_pipeline(config: dict) -> Pipeline:
    """Build and configure the Isolation Forest pipeline."""
    params = config.get("anomaly_sentinel", {})
    iso_forest = IsolationForest(
        n_estimators=params.get("n_estimators", 150),
        contamination=params.get("contamination", 0.05),
        random_state=params.get("random_state", 42),
        n_jobs=-1
    )
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("sentinel", iso_forest)
    ])


def categorize_anomaly_score(score: float, config: dict = None) -> str:
    """
    Categorize continuous decision function score into calibrated operational tiers.
    Higher score indicates normal project monitoring dynamics; negative indicates anomalous patterns.
    """
    thresholds = config.get("anomaly_sentinel", {}).get("thresholds", {}) if config else {}
    norm_min = thresholds.get("normal_min_score", 0.05)
    unusual_min = thresholds.get("unusual_min_score", 0.00)
    anom_min = thresholds.get("anomalous_min_score", -0.05)

    if score >= norm_min:
        return "NORMAL"
    elif score >= unusual_min:
        return "UNUSUAL"
    elif score >= anom_min:
        return "ANOMALOUS"
    else:
        return "REQUIRES_VERIFICATION"


def train_anomaly_sentinel(config_path: str = "configs/model_params.yaml") -> Dict[str, Any]:
    """Train unsupervised anomaly sentinel on historical data and persist artifact."""
    config = load_config(config_path)
    models_dir = config.get("paths", {}).get("models_dir", "models")
    anomaly_dir = os.path.join(models_dir, "anomaly_detector")
    os.makedirs(anomaly_dir, exist_ok=True)

    print("[ANOMALY SENTINEL] Preparing features for anomaly detection...")
    df = prepare_features(config.get("paths", {}).get("ml_ready_features"), config_path)
    splits = split_temporal_data(df, config_path)
    train_df = splits["train"]

    # Filter features available in training DataFrame
    feat_cols = [c for c in ANOMALY_FEATURE_COLUMNS if c in train_df.columns]
    X_train = train_df[feat_cols]

    print(f"[ANOMALY SENTINEL] Training Isolation Forest on {len(X_train):,} historical observations ({len(feat_cols)} features)...")
    pipeline = build_anomaly_pipeline(config)
    pipeline.fit(X_train)

    # Evaluate anomaly distribution on training & validation sets
    scores_train = pipeline.named_steps["sentinel"].decision_function(
        pipeline.named_steps["scaler"].transform(pipeline.named_steps["imputer"].transform(X_train))
    )
    unusual_cnt = (scores_train < 0.0).sum()
    print(f"[ANOMALY SENTINEL] Training set outlier rate: {unusual_cnt / len(scores_train):.2%}")

    artifact_path = os.path.join(anomaly_dir, "production_anomaly_detector.pkl")
    with open(artifact_path, "wb") as f:
        pickle.dump({
            "pipeline": pipeline,
            "feature_cols": feat_cols,
            "thresholds": config.get("anomaly_sentinel", {}).get("thresholds", {}),
            "data_status": config.get("metadata", {}).get("data_status", "SYNTHETIC / DEMONSTRATION")
        }, f)

    print(f"[ANOMALY SENTINEL] Persisted anomaly detector to {artifact_path}")
    return {
        "status": "success",
        "artifact_path": artifact_path,
        "features_count": len(feat_cols),
        "train_samples": len(X_train)
    }


def score_anomalies(df: pd.DataFrame,
                    model_package: dict,
                    config: dict = None) -> Tuple[np.ndarray, list]:
    """
    Score incoming project observations and return continuous score and categorical labels.
    """
    pipeline = model_package["pipeline"]
    feature_cols = model_package["feature_cols"]

    X = df[feature_cols]
    imputed = pipeline.named_steps["imputer"].transform(X)
    scaled = pipeline.named_steps["scaler"].transform(imputed)
    raw_scores = pipeline.named_steps["sentinel"].decision_function(scaled)

    categories = [categorize_anomaly_score(s, config) for s in raw_scores]
    return raw_scores, categories


if __name__ == "__main__":
    train_anomaly_sentinel()
