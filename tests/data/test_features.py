"""
tests/data/test_features.py - Feature Calculation Invariant Tests
Verifies mathematical integrity of engineered features in ML-ready dataset.
"""

import os
import pytest
import pandas as pd
import numpy as np

ML_READY_PATH = "data/features/paimana_ml_ready_time_overrun.csv"


@pytest.fixture(scope="module")
def df_features():
    assert os.path.exists(ML_READY_PATH), f"File not found: {ML_READY_PATH}"
    return pd.read_csv(ML_READY_PATH, low_memory=False)


def test_schedule_progress_gap_correlation(df_features):
    # Validates that schedule_progress_gap_pct inversely tracks elapsed_duration_pct
    corr = df_features[["schedule_progress_gap_pct", "elapsed_duration_pct"]].corr().iloc[0, 1]
    assert corr < -0.5, f"Expected strong negative correlation between gap and elapsed pct, got {corr}"


def test_remaining_cost_formula_on_unimputed_records(df_features):
    # Test formula on records where neither cost nor spend was missing
    valid = df_features[(df_features["original_cost_cr_missing"] == 0) & (df_features["cumulative_expenditure_cr_missing"] == 0)]
    assert len(valid) > 0, "No valid non-missing records found"
    expected_remaining = valid["original_cost_cr"] - valid["cumulative_expenditure_cr"]
    diff = np.abs(valid["remaining_original_cost_cr"] - expected_remaining)
    assert (diff < 1e-3).all(), f"Max remaining cost divergence: {diff.max()}"


def test_missing_indicator_flags_binary(df_features):
    missing_cols = [c for c in df_features.columns if c.endswith("_missing")]
    assert len(missing_cols) > 0, "No missing indicator columns found"
    for mc in missing_cols:
        unique_vals = set(df_features[mc].unique())
        assert unique_vals.issubset({0, 1}), f"Column {mc} has non-binary values: {unique_vals}"


def test_recent_progress_delta_non_negative(df_features):
    assert "progress_delta_recent" in df_features.columns
    negative_deltas = (df_features["progress_delta_recent"] < 0).sum()
    assert negative_deltas == 0, f"Found {negative_deltas} negative progress velocity deltas"
