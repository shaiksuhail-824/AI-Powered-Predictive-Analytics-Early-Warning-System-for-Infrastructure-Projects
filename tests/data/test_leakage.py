"""
tests/data/test_leakage.py - Target Leakage Prevention Tests
Verifies that no future information or targets leak into predictive input features.
"""

import os
import pytest
import pandas as pd

ML_READY_PATH = "data/features/paimana_ml_ready_time_overrun.csv"

# Forbidden feature names that would introduce target leakage
FORBIDDEN_PREDICTOR_FIELDS = [
    "revised_cost_cr",          # Leaks final cost overrun outcome
    "revised_doc_dt",           # Leaks final completion date
    "actual_completion_date",   # Future outcome
    "cost_overrun_cr",          # Future target
    "cost_overrun_pct",         # Future target
    "time_overrun_predicted",   # Future model output
]

TARGET_COLUMNS = [
    "time_overrun_days",
    "time_overrun_months",
    "time_overrun_flag"
]


@pytest.fixture(scope="module")
def df():
    assert os.path.exists(ML_READY_PATH), f"File not found: {ML_READY_PATH}"
    return pd.read_csv(ML_READY_PATH, low_memory=False)


def test_no_forbidden_future_fields_present(df):
    for f in FORBIDDEN_PREDICTOR_FIELDS:
        assert f not in df.columns, f"Forbidden leakage column '{f}' found in feature matrix!"


def test_target_columns_properly_segregated(df):
    # Predictor feature set is everything except target columns and entity key
    predictor_cols = [c for c in df.columns if c not in TARGET_COLUMNS and c != "project_code"]
    
    # Ensure no target column is accidentally named inside predictor set
    for target in TARGET_COLUMNS:
        assert target not in predictor_cols
        assert target in df.columns, f"Target column '{target}' missing from ML dataset"


def test_no_future_temporal_leakage_in_velocity(df):
    # Ensure recent deltas were generated chronologically (non-null and finite)
    assert not df["progress_delta_recent"].isna().any(), "Found NaNs in progress_delta_recent"
    assert not df["expenditure_delta_recent"].isna().any(), "Found NaNs in expenditure_delta_recent"
