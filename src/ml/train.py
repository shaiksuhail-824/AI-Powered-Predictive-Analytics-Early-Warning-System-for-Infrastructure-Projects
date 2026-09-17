"""
src/ml/train.py - Supervised Model Training Engine with MLflow Tracking
Trains Baseline 1 (Logistic Regression), Baseline 2 (Random Forest), and Candidate 3 (XGBoost)
across both CUF Baseline and Enhanced Feature Sets for Target A and Target B.
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

os.environ["MLFLOW_DISABLE_AGENT_HINT"] = "1"

import json
import pickle
import yaml
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, brier_score_loss, confusion_matrix
)
import mlflow
import mlflow.sklearn
import mlflow.xgboost

from src.ml.feature_pipeline import prepare_features, split_temporal_data, get_feature_columns, load_config


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, float]:
    """Calculate comprehensive classification metrics."""
    return {
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.5,
        "pr_auc": float(average_precision_score(y_true, y_prob)) if len(np.unique(y_true)) > 1 else 0.0,
        "brier_score": float(brier_score_loss(y_true, y_prob))
    }


def build_model_pipeline(model_type: str, params: dict, y_train: np.ndarray) -> Pipeline:
    """Build standardized scikit-learn pipeline for training."""
    seed = params.get("models", {}).get("random_seed", 42)

    if model_type == "logistic_regression":
        lr_params = params.get("models", {}).get("logistic_regression", {})
        model = LogisticRegression(
            C=lr_params.get("C", 1.0),
            max_iter=lr_params.get("max_iter", 1000),
            class_weight=lr_params.get("class_weight", "balanced"),
            solver=lr_params.get("solver", "lbfgs"),
            random_state=seed
        )
        return Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            ("classifier", model)
        ])

    elif model_type == "random_forest":
        rf_params = params.get("models", {}).get("random_forest", {})
        model = RandomForestClassifier(
            n_estimators=rf_params.get("n_estimators", 150),
            max_depth=rf_params.get("max_depth", 8),
            min_samples_split=rf_params.get("min_samples_split", 5),
            min_samples_leaf=rf_params.get("min_samples_leaf", 2),
            class_weight=rf_params.get("class_weight", "balanced"),
            random_state=seed,
            n_jobs=-1
        )
        return Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("classifier", model)
        ])

    elif model_type == "xgboost":
        xgb_params = params.get("models", {}).get("xgboost", {})
        # Calculate scale_pos_weight for class imbalance
        neg_count = float((y_train == 0).sum())
        pos_count = float((y_train == 1).sum())
        scale_pos_weight = neg_count / (pos_count + 1e-5) if pos_count > 0 else 1.0

        model = XGBClassifier(
            n_estimators=xgb_params.get("n_estimators", 150),
            max_depth=xgb_params.get("max_depth", 5),
            learning_rate=xgb_params.get("learning_rate", 0.05),
            subsample=xgb_params.get("subsample", 0.8),
            colsample_bytree=xgb_params.get("colsample_bytree", 0.8),
            scale_pos_weight=scale_pos_weight,
            eval_metric=xgb_params.get("eval_metric", "logloss"),
            random_state=seed,
            n_jobs=-1
        )
        return Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("classifier", model)
        ])
    else:
        raise ValueError(f"Unknown model_type: {model_type}")


def train_all_models(config_path: str = "configs/model_params.yaml") -> Dict[str, Any]:
    """Execute complete controlled model comparison and save candidate artifacts."""
    config = load_config(config_path)
    models_dir = config.get("paths", {}).get("models_dir", "models")
    reports_dir = config.get("paths", {}).get("reports_dir", "reports")
    mlflow_uri = config.get("paths", {}).get("mlflow_tracking_uri", "sqlite:///mlflow.db")

    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs("models/schedule_delay", exist_ok=True)
    os.makedirs("models/cost_overrun", exist_ok=True)

    mlflow.set_tracking_uri(mlflow_uri)
    experiment_name = "paimana_infrastructure_risk"
    mlflow.set_experiment(experiment_name)

    print("[TRAIN] Preparing anti-leakage features and temporal splits...")
    df = prepare_features(config.get("paths", {}).get("ml_ready_features"), config_path)
    splits = split_temporal_data(df, config_path)

    train_df = splits["train"]
    val_df = splits["val"]
    test_df = splits["test"]

    print(f"[TRAIN] Split sizes: Train={len(train_df):,}, Val={len(val_df):,}, Test={len(test_df):,}, Current={len(splits['current']):,}")

    targets = [
        ("schedule_delay", "future_schedule_delay"),
        ("cost_overrun", "future_cost_overrun")
    ]
    feature_types = ["cuf", "enhanced"]
    model_types = ["logistic_regression", "random_forest", "xgboost"]

    all_results = []

    for target_key, target_col in targets:
        print(f"\n==================================================")
        print(f"[TRAIN] TARGET: {target_key.upper()} ({target_col})")
        print(f"==================================================")

        for feat_type in feature_types:
            feature_cols = get_feature_columns(df, feat_type)
            print(f"\n--- Feature Set: {feat_type.upper()} ({len(feature_cols)} features) ---")

            X_train = train_df[feature_cols].copy()
            y_train = train_df[target_col].astype(int).values

            X_val = val_df[feature_cols].copy()
            y_val = val_df[target_col].astype(int).values

            X_test = test_df[feature_cols].copy()
            y_test = test_df[target_col].astype(int).values

            for m_type in model_types:
                run_name = f"{target_key}_{feat_type}_{m_type}"
                print(f"[TRAIN] Training {run_name}...")

                with mlflow.start_run(run_name=run_name):
                    pipeline = build_model_pipeline(m_type, config, y_train)
                    pipeline.fit(X_train, y_train)

                    # Predictions
                    train_prob = pipeline.predict_proba(X_train)[:, 1]
                    train_pred = pipeline.predict(X_train)
                    val_prob = pipeline.predict_proba(X_val)[:, 1]
                    val_pred = pipeline.predict(X_val)
                    test_prob = pipeline.predict_proba(X_test)[:, 1]
                    test_pred = pipeline.predict(X_test)

                    train_metrics = compute_metrics(y_train, train_pred, train_prob)
                    val_metrics = compute_metrics(y_val, val_pred, val_prob)
                    test_metrics = compute_metrics(y_test, test_pred, test_prob)

                    # Log MLflow parameters & metrics
                    mlflow.log_param("target", target_key)
                    mlflow.log_param("target_column", target_col)
                    mlflow.log_param("feature_type", feat_type)
                    mlflow.log_param("model_type", m_type)
                    mlflow.log_param("features_count", len(feature_cols))
                    mlflow.log_param("data_status", config.get("metadata", {}).get("data_status", "REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS"))
                    mlflow.log_param("train_samples", len(X_train))
                    mlflow.log_param("val_samples", len(X_val))
                    mlflow.log_param("test_samples", len(X_test))

                    for k, v in val_metrics.items():
                        mlflow.log_metric(f"val_{k}", v)
                    for k, v in test_metrics.items():
                        mlflow.log_metric(f"test_{k}", v)
                    for k, v in train_metrics.items():
                        mlflow.log_metric(f"train_{k}", v)

                    # Save pipeline artifact
                    model_path = os.path.join(models_dir, f"{run_name}.pkl")
                    with open(model_path, "wb") as f:
                        pickle.dump({
                            "pipeline": pipeline,
                            "feature_cols": feature_cols,
                            "target_key": target_key,
                            "target_col": target_col,
                            "feature_type": feat_type,
                            "model_type": m_type,
                            "train_metrics": train_metrics,
                            "val_metrics": val_metrics,
                            "test_metrics": test_metrics,
                            "data_status": config.get("metadata", {}).get("data_status", "REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS")
                        }, f)

                    mlflow.log_artifact(model_path, artifact_path="model_package")

                    result_entry = {
                        "target": target_key,
                        "feature_type": feat_type,
                        "model_type": m_type,
                        "features_count": len(feature_cols),
                        "val_precision": val_metrics["precision"],
                        "val_recall": val_metrics["recall"],
                        "val_f1": val_metrics["f1"],
                        "val_roc_auc": val_metrics["roc_auc"],
                        "val_pr_auc": val_metrics["pr_auc"],
                        "test_precision": test_metrics["precision"],
                        "test_recall": test_metrics["recall"],
                        "test_f1": test_metrics["f1"],
                        "test_roc_auc": test_metrics["roc_auc"],
                        "test_pr_auc": test_metrics["pr_auc"],
                        "train_f1": train_metrics["f1"],
                        "model_path": model_path
                    }
                    all_results.append(result_entry)

                    print(f"   Val  -> F1: {val_metrics['f1']:.4f} | Recall: {val_metrics['recall']:.4f} | ROC-AUC: {val_metrics['roc_auc']:.4f}")
                    print(f"   Test -> F1: {test_metrics['f1']:.4f} | Recall: {test_metrics['recall']:.4f} | ROC-AUC: {test_metrics['roc_auc']:.4f}")

    results_df = pd.DataFrame(all_results)
    results_path = os.path.join(reports_dir, "training_run_summary.csv")
    results_df.to_csv(results_path, index=False)
    print(f"\n[TRAIN] Saved training run summary to {results_path}")

    return {
        "status": "success",
        "total_models_trained": len(all_results),
        "results": all_results
    }


if __name__ == "__main__":
    train_all_models()
