"""
src/ml/model_selection.py - Metric-Driven Winning Model Selection
Selects optimal models for Target A (Schedule Delay) and Target B (Cost Overrun)
based on validation metrics (prioritizing high-risk recall and F1) and exports production artifacts.
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
import shutil
import pickle
import pandas as pd
from typing import Dict, Any


def select_best_models(summary_path: str = "reports/training_run_summary.csv",
                       models_dir: str = "models") -> Dict[str, Any]:
    """Select winning models and copy to designated production artifact paths."""
    if not os.path.exists(summary_path):
        raise FileNotFoundError(f"Training run summary missing at: {summary_path}")

    df = pd.read_csv(summary_path)

    # 1. Target A Selection: Schedule Delay
    # Prioritize balanced F1 and Recall on delayed projects
    delay_df = df[df["target"] == "schedule_delay"].copy()
    # Rank by composite score: 0.6 * val_f1 + 0.4 * val_recall
    delay_df["selection_score"] = 0.6 * delay_df["val_f1"] + 0.4 * delay_df["val_recall"]
    best_delay = delay_df.sort_values("selection_score", ascending=False).iloc[0].to_dict()

    # 2. Target B Selection: Cost Overrun
    # Cost overrun is class imbalanced (~13% positive), prioritize PR-AUC and F1
    cost_df = df[df["target"] == "cost_overrun"].copy()
    cost_df["selection_score"] = 0.5 * cost_df["val_pr_auc"] + 0.5 * cost_df["val_f1"]
    best_cost = cost_df.sort_values("selection_score", ascending=False).iloc[0].to_dict()

    # Destination directories
    delay_prod_dir = os.path.join(models_dir, "schedule_delay")
    cost_prod_dir = os.path.join(models_dir, "cost_overrun")
    os.makedirs(delay_prod_dir, exist_ok=True)
    os.makedirs(cost_prod_dir, exist_ok=True)

    delay_dest = os.path.join(delay_prod_dir, "production_model.pkl")
    cost_dest = os.path.join(cost_prod_dir, "production_model.pkl")

    shutil.copy2(best_delay["model_path"], delay_dest)
    shutil.copy2(best_cost["model_path"], cost_dest)

    selection_summary = {
        "schedule_delay": {
            "selected_model": f"{best_delay['target']}_{best_delay['feature_type']}_{best_delay['model_type']}",
            "feature_type": best_delay["feature_type"],
            "model_type": best_delay["model_type"],
            "features_count": int(best_delay["features_count"]),
            "val_f1": float(best_delay["val_f1"]),
            "val_recall": float(best_delay["val_recall"]),
            "val_roc_auc": float(best_delay["val_roc_auc"]),
            "test_f1": float(best_delay["test_f1"]),
            "test_recall": float(best_delay["test_recall"]),
            "test_roc_auc": float(best_delay["test_roc_auc"]),
            "selection_rationale": "Maximized composite validation F1 and Recall on high-risk delayed projects",
            "production_path": delay_dest
        },
        "cost_overrun": {
            "selected_model": f"{best_cost['target']}_{best_cost['feature_type']}_{best_cost['model_type']}",
            "feature_type": best_cost["feature_type"],
            "model_type": best_cost["model_type"],
            "features_count": int(best_cost["features_count"]),
            "val_f1": float(best_cost["val_f1"]),
            "val_pr_auc": float(best_cost["val_pr_auc"]),
            "val_roc_auc": float(best_cost["val_roc_auc"]),
            "test_f1": float(best_cost["test_f1"]),
            "test_pr_auc": float(best_cost["test_pr_auc"]),
            "test_roc_auc": float(best_cost["test_roc_auc"]),
            "selection_rationale": "Maximized PR-AUC and F1 for imbalanced cost overrun classification",
            "production_path": cost_dest
        }
    }

    summary_file = os.path.join(models_dir, "selected_models_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(selection_summary, f, indent=2)

    print(f"\n[MODEL SELECTION] Selected Best Models:")
    print(f" -> Schedule Delay: {selection_summary['schedule_delay']['selected_model']} (Val F1: {best_delay['val_f1']:.4f}, Test F1: {best_delay['test_f1']:.4f})")
    print(f" -> Cost Overrun:   {selection_summary['cost_overrun']['selected_model']} (Val PR-AUC: {best_cost['val_pr_auc']:.4f}, Test PR-AUC: {best_cost['test_pr_auc']:.4f})")
    print(f"[MODEL SELECTION] Artifacts copied to {delay_dest} and {cost_dest}")

    return selection_summary


if __name__ == "__main__":
    select_best_models()
