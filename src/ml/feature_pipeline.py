"""
src/ml/feature_pipeline.py - Feature Transformation & Temporal Splitting Pipeline
Constructs future prediction targets without leakage and prepares CUF vs Enhanced feature sets.
Supports strictly chronological validation and partitions Current (April-July 2026) inference data.
"""

import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import yaml
import numpy as np
import pandas as pd
from typing import Dict, Tuple, List

# Forbidden predictor fields that must NEVER enter feature matrices X
FORBIDDEN_PREDICTOR_FIELDS = [
    "future_schedule_delay",
    "future_cost_overrun",
    "next_expenditure",
    "next_time_overrun_flag",
    "revised_cost_cr",
    "revised_doc_dt",
    "actual_completion_date",
    "cost_overrun_cr",
    "cost_overrun_pct",
    "time_overrun_predicted",
]

# Baseline Common Utility Format (CUF) features tracking conventional MIS fields
CUF_FEATURE_COLUMNS = [
    "agency_frequency",
    "state_frequency",
    "original_cost_cr",
    "cumulative_expenditure_cr",
    "physical_progress_pct",
    "approval_to_start_days",
    "planned_duration_days",
    "elapsed_duration_days",
    "time_overrun_months",
    "time_overrun_flag",
]


def load_config(config_path: str = "configs/model_params.yaml") -> dict:
    """Load model parameters and pipeline configuration."""
    if not os.path.exists(config_path):
        return {}
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def prepare_features(input_path: str = "data/features/paimana_ml_ready_time_overrun.csv",
                     config_path: str = "configs/model_params.yaml") -> pd.DataFrame:
    """
    Load feature dataset, engineer anti-leakage future targets, and compute dynamic features.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Missing feature dataset: {input_path}")

    config = load_config(config_path)
    df = pd.read_csv(input_path, low_memory=False)

    # 1. Temporal Ordering
    df["report_date"] = pd.to_datetime(
        df["report_year"].astype(str) + "-" + df["report_month_num"].astype(str).str.zfill(2) + "-01"
    )
    df = df.sort_values(by=["project_code", "report_date"]).reset_index(drop=True)

    # 2. Construct Supervised Future Targets (Anti-Leakage Guaranteed)
    # Target A: Future Schedule Delay in subsequent period T+1
    delay_threshold = config.get("targets", {}).get("schedule_delay", {}).get("threshold_months", 1.0)
    future_delay_months = df.groupby("project_code")["time_overrun_months"].shift(-1)
    future_delay_flag = df.groupby("project_code")["time_overrun_flag"].shift(-1)
    df["future_schedule_delay"] = np.where(
        future_delay_months.notna(),
        ((future_delay_months >= delay_threshold) | (future_delay_flag == 1)).astype(float),
        np.nan
    )

    # Target B: Future Cost Overrun in subsequent period T+1
    # Overrun occurs when future cumulative expenditure exceeds original sanctioned cost
    future_exp = df.groupby("project_code")["cumulative_expenditure_cr"].shift(-1)
    df["future_cost_overrun"] = np.where(
        future_exp.notna(),
        (future_exp > df["original_cost_cr"]).astype(float),
        np.nan
    )

    # 3. Derived Engineering Features Available at Time T
    df["project_age_months"] = df["elapsed_duration_days"] / 30.4375
    df["months_since_start"] = df["elapsed_duration_days"] / 30.4375
    df["progress_velocity"] = df["progress_delta_recent"]
    df["progress_stagnation"] = ((df["progress_delta_recent"] <= 0.0) & (df["physical_progress_pct"] < 100.0)).astype(int)
    df["cost_variance_cr"] = df["remaining_original_cost_cr"]
    df["cost_variance_pct"] = ((df["cumulative_expenditure_cr"] - df["original_cost_cr"]) / (df["original_cost_cr"] + 1e-5)) * 100.0
    df["expenditure_to_cost_ratio"] = df["cumulative_expenditure_cr"] / (df["original_cost_cr"] + 1e-5)
    df["monthly_expenditure"] = df["expenditure_delta_recent"]
    df["expenditure_burn_rate"] = df["cumulative_expenditure_cr"] / (df["project_age_months"].clip(lower=0.1))
    df["financial_year"] = np.where(df["report_month_num"] >= 4, df["report_year"], df["report_year"] - 1)

    return df


def get_feature_columns(df: pd.DataFrame, feature_set: str = "enhanced") -> List[str]:
    """
    Get strictly validated feature column list for CUF or Enhanced model types.
    Enforces anti-leakage exclusions.
    """
    if feature_set.lower() == "cuf":
        cols = [c for c in CUF_FEATURE_COLUMNS if c in df.columns]
    elif feature_set.lower() == "enhanced":
        exclude = set(FORBIDDEN_PREDICTOR_FIELDS + [
            "project_code", "report_date", "report_year", "report_month_num"
        ])
        cols = [c for c in df.columns if c not in exclude and not c.startswith("future_") and not c.startswith("next_")]
    else:
        raise ValueError(f"Unknown feature set '{feature_set}'. Must be 'cuf' or 'enhanced'.")

    # Anti-leakage assertion
    for f in FORBIDDEN_PREDICTOR_FIELDS:
        if f in cols:
            raise ValueError(f"CRITICAL DATA LEAKAGE: Forbidden column '{f}' found in feature list!")

    return sorted(cols)


def split_temporal_data(df: pd.DataFrame,
                        config_path: str = "configs/model_params.yaml") -> Dict[str, pd.DataFrame]:
    """
    Split data chronologically into:
    - train: historical earlier periods (2025-04 through 2025-11)
    - val: historical validation periods (2025-12 through 2026-01)
    - test: historical holdout test periods (2026-02 through 2026-03)
    - current: current 4-month inference set (2026-04 through 2026-07)
    """
    config = load_config(config_path)
    splits = config.get("temporal_split", {})
    train_end = pd.to_datetime(splits.get("train_end", "2025-11-01"))
    val_end = pd.to_datetime(splits.get("val_end", "2026-01-01"))
    test_end = pd.to_datetime(splits.get("test_end", "2026-03-01"))
    current_start = pd.to_datetime(splits.get("current_start", "2026-04-01"))

    # Labeled historical set where future targets exist
    labeled_df = df[df["future_schedule_delay"].notna() & df["future_cost_overrun"].notna()].copy()

    train_df = labeled_df[labeled_df["report_date"] <= train_end].copy()
    val_df = labeled_df[(labeled_df["report_date"] > train_end) & (labeled_df["report_date"] <= val_end)].copy()
    test_df = labeled_df[(labeled_df["report_date"] > val_end) & (labeled_df["report_date"] <= test_end)].copy()

    # Current inference set (April–July 2026) where future ground truth is unobserved
    current_df = df[df["report_date"] >= current_start].copy()

    return {
        "train": train_df,
        "val": val_df,
        "test": test_df,
        "current": current_df,
        "labeled": labeled_df
    }


def verify_no_leakage(df_features: pd.DataFrame):
    """Automated test assertion ensuring zero target leakage in feature matrix."""
    for forbidden in FORBIDDEN_PREDICTOR_FIELDS:
        if forbidden in df_features.columns:
            raise AssertionError(f"LEAKAGE DETECTED: Forbidden column '{forbidden}' in feature matrix!")
    print("[LEAKAGE CHECK] PASSED: All feature columns confirmed free of future target leakage.")
