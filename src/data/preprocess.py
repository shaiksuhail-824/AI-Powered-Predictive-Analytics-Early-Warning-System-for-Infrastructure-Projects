"""
src/data/preprocess.py - Preprocessing Stage for SIH26103
Applies parameter-driven data cleaning, type standardizations, bounding, and imputation.
Outputs clean analytical dataset to data/processed/paimana_time_overrun_processed.csv.
"""

import os
import sys
import yaml
import pandas as pd
import numpy as np


def load_params(params_path: str = "params.yaml") -> dict:
    """Load configurable pipeline parameters."""
    if not os.path.exists(params_path):
        return {
            "preprocessing": {
                "missing_threshold": 0.5,
                "progress_min_clip": 0.0,
                "progress_max_clip": 100.0,
                "expenditure_ratio_max_clip": 500.0,
                "drop_duplicates": True
            }
        }
    with open(params_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def preprocess_data(input_path: str = "data/interim/paimana_time_overrun_validated.csv",
                    output_path: str = "data/processed/paimana_time_overrun_processed.csv",
                    params_path: str = "params.yaml") -> dict:
    """Execute reproducible preprocessing transformations."""
    params = load_params(params_path).get("preprocessing", {})
    print(f"[PREPROCESS] Loading validated data from {input_path}...")
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Missing input dataset: {input_path}")

    df = pd.read_csv(input_path, low_memory=False)
    initial_rows = len(df)
    print(f"[PREPROCESS] Loaded {initial_rows:,} records.")

    # 1. Type Normalization
    df["project_code"] = df["project_code"].astype(str).str.strip()
    df["report_year"] = df["report_year"].astype(int)
    df["report_month_num"] = df["report_month_num"].astype(int)

    # Construct standard date key for temporal order
    df["report_date"] = pd.to_datetime(
        df["report_year"].astype(str) + "-" + df["report_month_num"].astype(str).str.zfill(2) + "-01"
    )

    # 2. Duplicate Handling
    if params.get("drop_duplicates", True):
        duplicates_removed = int(df.duplicated(subset=["project_code", "report_year", "report_month_num"]).sum())
        if duplicates_removed > 0:
            df = df.drop_duplicates(subset=["project_code", "report_year", "report_month_num"]).reset_index(drop=True)
            print(f"[PREPROCESS] Removed {duplicates_removed} duplicate observations.")
        else:
            print("[PREPROCESS] Checked row uniqueness: 0 duplicates found.")

    # 3. Numeric Bounding & Sanity Clipping
    min_prog = params.get("progress_min_clip", 0.0)
    max_prog = params.get("progress_max_clip", 100.0)
    df["physical_progress_pct"] = df["physical_progress_pct"].clip(lower=min_prog, upper=max_prog)

    max_exp_ratio = params.get("expenditure_ratio_max_clip", 500.0)
    df["expenditure_to_original_cost_pct"] = df["expenditure_to_original_cost_pct"].clip(upper=max_exp_ratio)

    # 4. Target Cleanliness
    # Ensure targets are float and non-negative
    df["time_overrun_days"] = df["time_overrun_days"].clip(lower=0.0)
    df["time_overrun_months"] = df["time_overrun_months"].clip(lower=0.0)
    df["time_overrun_flag"] = df["time_overrun_flag"].astype(int)

    # 5. Sort chronologically for temporal integrity
    df = df.sort_values(by=["project_code", "report_date"]).reset_index(drop=True)

    # Save processed dataset
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[PREPROCESS] Saved clean processed dataset to {output_path} ({len(df):,} rows, {len(df.columns)} cols).")

    return {
        "status": "success",
        "initial_rows": initial_rows,
        "processed_rows": len(df),
        "columns": len(df.columns)
    }


if __name__ == "__main__":
    preprocess_data()
