"""
src/ml/evaluate.py - Model Evaluation, CUF vs Enhanced Comparison, and Diagnostic Figures
Computes comprehensive metrics, CUF-to-Enhanced predictive lift, overfitting/underfitting diagnostics,
and saves ROC, PR, and Confusion Matrix figures to reports/figures/.
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
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import (
    roc_curve, precision_recall_curve, confusion_matrix,
    ConfusionMatrixDisplay, roc_auc_score, average_precision_score
)

from src.ml.feature_pipeline import prepare_features, split_temporal_data, get_feature_columns, load_config


def evaluate_models_and_generate_plots(config_path: str = "configs/model_params.yaml") -> dict:
    """Run full evaluation suite, generate comparison metrics and figures."""
    config = load_config(config_path)
    models_dir = config.get("paths", {}).get("models_dir", "models")
    reports_dir = config.get("paths", {}).get("reports_dir", "reports")
    figures_dir = config.get("paths", {}).get("figures_dir", "reports/figures")

    os.makedirs(figures_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    summary_path = os.path.join(reports_dir, "training_run_summary.csv")
    if not os.path.exists(summary_path):
        raise FileNotFoundError(f"Training summary missing: {summary_path}")

    summary_df = pd.read_csv(summary_path)

    # 1. Overfitting & Underfitting Analysis
    summary_df["generalization_gap_f1"] = summary_df["train_f1"] - summary_df["test_f1"]
    summary_df["diagnostic"] = np.where(
        summary_df["train_f1"] < 0.60, "Underfitting",
        np.where(summary_df["generalization_gap_f1"] > 0.15, "Moderate Overfitting",
        np.where(summary_df["generalization_gap_f1"] > 0.25, "Severe Overfitting", "Well-Regularized"))
    )

    diagnostic_path = os.path.join(reports_dir, "overfitting_underfitting_summary.csv")
    summary_df.to_csv(diagnostic_path, index=False)
    print(f"[EVALUATE] Saved overfitting/underfitting diagnostic to {diagnostic_path}")

    # 2. CUF Baseline vs Enhanced Lift
    cuf_vs_enhanced = []
    for target in ["schedule_delay", "cost_overrun"]:
        t_df = summary_df[summary_df["target"] == target]
        for m_type in t_df["model_type"].unique():
            cuf_row = t_df[(t_df["model_type"] == m_type) & (t_df["feature_type"] == "cuf")].iloc[0]
            enh_row = t_df[(t_df["model_type"] == m_type) & (t_df["feature_type"] == "enhanced")].iloc[0]

            f1_lift_pct = ((enh_row["test_f1"] - cuf_row["test_f1"]) / (cuf_row["test_f1"] + 1e-5)) * 100.0
            recall_lift_pct = ((enh_row["test_recall"] - cuf_row["test_recall"]) / (cuf_row["test_recall"] + 1e-5)) * 100.0
            roc_lift_pct = ((enh_row["test_roc_auc"] - cuf_row["test_roc_auc"]) / (cuf_row["test_roc_auc"] + 1e-5)) * 100.0

            cuf_vs_enhanced.append({
                "target": target,
                "model_type": m_type,
                "cuf_test_f1": cuf_row["test_f1"],
                "enhanced_test_f1": enh_row["test_f1"],
                "f1_lift_pct": f1_lift_pct,
                "cuf_test_recall": cuf_row["test_recall"],
                "enhanced_test_recall": enh_row["test_recall"],
                "recall_lift_pct": recall_lift_pct,
                "cuf_test_roc_auc": cuf_row["test_roc_auc"],
                "enhanced_test_roc_auc": enh_row["test_roc_auc"],
                "roc_lift_pct": roc_lift_pct
            })

    lift_df = pd.DataFrame(cuf_vs_enhanced)
    lift_path = os.path.join(reports_dir, "cuf_vs_enhanced_comparison.csv")
    lift_df.to_csv(lift_path, index=False)
    print(f"[EVALUATE] Saved CUF vs Enhanced lift comparison to {lift_path}")

    # 3. Load Production Models and Compute Holdout Plots
    df = prepare_features(config.get("paths", {}).get("ml_ready_features"), config_path)
    splits = split_temporal_data(df, config_path)
    test_df = splits["test"]

    prod_models = {
        "Schedule Delay": os.path.join(models_dir, "schedule_delay", "production_model.pkl"),
        "Cost Overrun": os.path.join(models_dir, "cost_overrun", "production_model.pkl")
    }

    # Plot ROC & PR Curves
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    for name, path in prod_models.items():
        if not os.path.exists(path):
            continue
        with open(path, "rb") as f:
            pkg = pickle.load(f)

        pipe = pkg["pipeline"]
        features = pkg["feature_cols"]
        target_col = pkg["target_col"]

        X_test = test_df[features]
        y_test = test_df[target_col].astype(int).values
        y_prob = pipe.predict_proba(X_test)[:, 1]

        # ROC Curve
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        roc_auc = roc_auc_score(y_test, y_prob)
        axes[0].plot(fpr, tpr, label=f"{name} (AUC = {roc_auc:.3f})", lw=2)

        # PR Curve
        precision, recall, _ = precision_recall_curve(y_test, y_prob)
        pr_auc = average_precision_score(y_test, y_prob)
        axes[1].plot(recall, precision, label=f"{name} (PR-AUC = {pr_auc:.3f})", lw=2)

    axes[0].plot([0, 1], [0, 1], "k--", alpha=0.6)
    axes[0].set_title("ROC Curves on Holdout Temporal Test Set")
    axes[0].set_xlabel("False Positive Rate")
    axes[0].set_ylabel("True Positive Rate (Recall)")
    axes[0].legend(loc="lower right")
    axes[0].grid(True, alpha=0.3)

    axes[1].set_title("Precision-Recall Curves on Holdout Temporal Test Set")
    axes[1].set_xlabel("Recall")
    axes[1].set_ylabel("Precision")
    axes[1].legend(loc="lower left")
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    roc_pr_path = os.path.join(figures_dir, "production_roc_pr_curves.png")
    plt.savefig(roc_pr_path, dpi=200)
    plt.close()
    print(f"[EVALUATE] Saved ROC & PR curves to {roc_pr_path}")

    # Plot Confusion Matrices
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    idx = 0
    for name, path in prod_models.items():
        if not os.path.exists(path):
            continue
        with open(path, "rb") as f:
            pkg = pickle.load(f)

        pipe = pkg["pipeline"]
        features = pkg["feature_cols"]
        target_col = pkg["target_col"]

        X_test = test_df[features]
        y_test = test_df[target_col].astype(int).values
        y_pred = pipe.predict(X_test)

        cm = confusion_matrix(y_test, y_pred)
        disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=["Normal/On-Time", "Delayed/Overrun"])
        disp.plot(ax=axes[idx], cmap="Blues", colorbar=False)
        axes[idx].set_title(f"Confusion Matrix: {name}")
        idx += 1

    plt.tight_layout()
    cm_path = os.path.join(figures_dir, "production_confusion_matrices.png")
    plt.savefig(cm_path, dpi=200)
    plt.close()
    print(f"[EVALUATE] Saved Confusion Matrices to {cm_path}")

    return {
        "status": "success",
        "diagnostic_path": diagnostic_path,
        "lift_path": lift_path,
        "figures": [roc_pr_path, cm_path]
    }


if __name__ == "__main__":
    evaluate_models_and_generate_plots()
