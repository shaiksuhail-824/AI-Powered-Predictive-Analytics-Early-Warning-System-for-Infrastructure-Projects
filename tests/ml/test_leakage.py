"""
tests/ml/test_leakage.py - Strict Anti-Leakage & Temporal Causality Tests
Ensures zero future information or target variables enter predictor feature matrices.
"""

import pytest
import pandas as pd
import numpy as np

from src.ml.feature_pipeline import (
    prepare_features, get_feature_columns, split_temporal_data,
    FORBIDDEN_PREDICTOR_FIELDS, verify_no_leakage
)


@pytest.fixture(scope="module")
def full_df():
    return prepare_features("data/features/paimana_ml_ready_time_overrun.csv")


def test_no_forbidden_fields_in_cuf_feature_columns(full_df):
    cuf_cols = get_feature_columns(full_df, "cuf")
    for f in FORBIDDEN_PREDICTOR_FIELDS:
        assert f not in cuf_cols, f"Forbidden leakage field '{f}' found in CUF feature columns!"


def test_no_forbidden_fields_in_enhanced_feature_columns(full_df):
    enh_cols = get_feature_columns(full_df, "enhanced")
    for f in FORBIDDEN_PREDICTOR_FIELDS:
        assert f not in enh_cols, f"Forbidden leakage field '{f}' found in Enhanced feature columns!"


def test_no_future_prefixed_features_in_matrix(full_df):
    enh_cols = get_feature_columns(full_df, "enhanced")
    future_cols = [c for c in enh_cols if c.startswith("future_") or c.startswith("next_")]
    assert len(future_cols) == 0, f"Found future-prefixed columns in feature matrix: {future_cols}"


def test_temporal_split_order_strictly_chronological(full_df):
    splits = split_temporal_data(full_df)
    train_df = splits["train"]
    val_df = splits["val"]
    test_df = splits["test"]
    current_df = splits["current"]

    assert train_df["report_date"].max() < val_df["report_date"].min(), "Train overlaps into Validation!"
    assert val_df["report_date"].max() < test_df["report_date"].min(), "Validation overlaps into Test!"
    assert test_df["report_date"].max() < current_df["report_date"].min(), "Test overlaps into Current Inference!"


def test_anti_leakage_verifier_raises_on_forbidden_column():
    bad_df = pd.DataFrame({
        "project_age_months": [12.0],
        "revised_cost_cr": [150.0]  # Forbidden!
    })
    with pytest.raises(AssertionError):
        verify_no_leakage(bad_df)
