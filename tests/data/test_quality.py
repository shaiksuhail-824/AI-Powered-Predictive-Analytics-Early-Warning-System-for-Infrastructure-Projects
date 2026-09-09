"""
tests/data/test_quality.py - Data Quality and Invariant Tests
Verifies bounds, uniqueness, and non-negative constraints on processed and feature datasets.
"""

import os
import pytest
import pandas as pd
import numpy as np

PROCESSED_PATH = "data/processed/paimana_time_overrun_processed.csv"
ML_READY_PATH = "data/features/paimana_ml_ready_time_overrun.csv"


@pytest.fixture(scope="module")
def processed_data():
    assert os.path.exists(PROCESSED_PATH), f"Processed dataset missing: {PROCESSED_PATH}"
    return pd.read_csv(PROCESSED_PATH, low_memory=False)


@pytest.fixture(scope="module")
def feature_data():
    assert os.path.exists(ML_READY_PATH), f"Feature dataset missing: {ML_READY_PATH}"
    return pd.read_csv(ML_READY_PATH, low_memory=False)


def test_no_duplicate_records(processed_data):
    dups = processed_data.duplicated(subset=["project_code", "report_year", "report_month_num"]).sum()
    assert dups == 0, f"Found {dups} duplicate project-temporal observations"


def test_non_negative_sanction_cost(processed_data):
    negative_cost = (processed_data["original_cost_cr"] < 0).sum()
    assert negative_cost == 0, f"Found {negative_cost} records with negative original cost"


def test_non_negative_cumulative_expenditure(processed_data):
    negative_spend = (processed_data["cumulative_expenditure_cr"] < 0).sum()
    assert negative_spend == 0, f"Found {negative_spend} records with negative expenditure"


def test_physical_progress_bounds(processed_data):
    invalid_progress = ((processed_data["physical_progress_pct"] < 0.0) | (processed_data["physical_progress_pct"] > 100.0)).sum()
    assert invalid_progress == 0, f"Found {invalid_progress} records with progress outside [0, 100]%"


def test_binary_target_validity(feature_data):
    unique_targets = set(feature_data["time_overrun_flag"].unique())
    assert unique_targets.issubset({0, 1}), f"Unexpected target values: {unique_targets}"


def test_non_negative_time_overrun_days(feature_data):
    negative_delays = (feature_data["time_overrun_days"] < 0).sum()
    assert negative_delays == 0, f"Found {negative_delays} negative delay values in target"
