"""
tests/data/test_schema.py - Schema and Column Invariant Tests
Verifies dataset existence, expected columns, and non-empty rows across all pipeline stages.
"""

import os
import pytest
import pandas as pd

RAW_PATH = "data/raw/paimana_time_overrun.csv"
INTERIM_PATH = "data/interim/paimana_time_overrun_validated.csv"
PROCESSED_PATH = "data/processed/paimana_time_overrun_processed.csv"
CUF_BASELINE_PATH = "data/features/paimana_cuf_baseline.csv"
ML_READY_PATH = "data/features/paimana_ml_ready_time_overrun.csv"

MANDATORY_RAW_COLUMNS = [
    "project_code", "report_year", "report_month_num",
    "agency_frequency", "state_frequency",
    "original_cost_cr", "cumulative_expenditure_cr", "physical_progress_pct",
    "expenditure_to_original_cost_pct", "expenditure_per_progress_pct_cr", "remaining_original_cost_cr",
    "approval_to_start_days", "planned_duration_days", "elapsed_duration_days",
    "remaining_planned_days", "elapsed_duration_pct", "progress_per_elapsed_month",
    "schedule_progress_gap_pct",
    "time_overrun_days", "time_overrun_months", "time_overrun_flag"
]


def test_raw_dataset_exists_and_schema():
    assert os.path.exists(RAW_PATH), f"Raw dataset not found at {RAW_PATH}"
    df = pd.read_csv(RAW_PATH, nrows=50)
    assert len(df) > 0, "Raw dataset is empty"
    for col in MANDATORY_RAW_COLUMNS:
        assert col in df.columns, f"Mandatory column '{col}' missing from raw dataset"
    assert len(df.columns) == 38, f"Expected 38 raw columns, got {len(df.columns)}"


def test_interim_validated_dataset_exists():
    assert os.path.exists(INTERIM_PATH), f"Interim dataset not found at {INTERIM_PATH}"
    df = pd.read_csv(INTERIM_PATH, nrows=10)
    assert len(df) > 0, "Interim dataset is empty"


def test_processed_dataset_schema():
    assert os.path.exists(PROCESSED_PATH), f"Processed dataset not found at {PROCESSED_PATH}"
    df = pd.read_csv(PROCESSED_PATH, nrows=10)
    assert "project_code" in df.columns
    assert "report_year" in df.columns
    assert "report_month_num" in df.columns
    assert "time_overrun_flag" in df.columns


def test_feature_datasets_exist_and_partitioned():
    assert os.path.exists(CUF_BASELINE_PATH), f"CUF baseline not found at {CUF_BASELINE_PATH}"
    assert os.path.exists(ML_READY_PATH), f"ML-ready dataset not found at {ML_READY_PATH}"
    
    cuf_df = pd.read_csv(CUF_BASELINE_PATH, nrows=10)
    ml_df = pd.read_csv(ML_READY_PATH, nrows=10)
    
    assert len(cuf_df.columns) < len(ml_df.columns), "CUF baseline should contain fewer columns than extended ML-ready dataset"
    assert "time_overrun_flag" in cuf_df.columns
    assert "time_overrun_flag" in ml_df.columns
