"""
tests/ml/test_predictions.py - End-to-End Prediction and Inference Tests
Verifies PAIMANAPredictor execution, single-row and batch inference, and schema compliance.
"""

import os
import pytest
import pandas as pd
import numpy as np

from src.ml.predict import PAIMANAPredictor
from src.ml.feature_pipeline import prepare_features


@pytest.fixture(scope="module")
def predictor():
    return PAIMANAPredictor()


@pytest.fixture(scope="module")
def sample_data():
    df = prepare_features("data/features/paimana_ml_ready_time_overrun.csv")
    return df.head(10)


def test_predict_single_generates_valid_schema(predictor, sample_data):
    row = sample_data.iloc[0]
    res = predictor.predict_single(row)

    required_keys = [
        "project_code", "prediction_timestamp", "schedule_delay_probability",
        "cost_overrun_probability", "overall_risk_score", "risk_level",
        "risk_trajectory", "risk_delta", "anomaly_status", "intervention_priority",
        "top_risk_drivers", "what_changed_since_last_month", "data_status"
    ]
    for k in required_keys:
        assert k in res, f"Missing required API key '{k}' in prediction output"

    assert 0.0 <= res["schedule_delay_probability"] <= 1.0
    assert 0.0 <= res["cost_overrun_probability"] <= 1.0
    assert 0.0 <= res["overall_risk_score"] <= 100.0
    assert res["risk_level"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert res["anomaly_status"] in {"NORMAL", "UNUSUAL", "ANOMALOUS", "REQUIRES_VERIFICATION"}
    assert res["intervention_priority"] in {"LOW", "MEDIUM", "HIGH", "CRITICAL_INTERVENTION"}
    assert res["data_status"] == "REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS"


def test_predict_batch_returns_expected_rows(predictor, sample_data):
    batch_df = predictor.predict_batch(sample_data)
    assert len(batch_df) == len(sample_data)
    assert "overall_risk_score" in batch_df.columns
    assert "risk_level" in batch_df.columns
    assert not batch_df["overall_risk_score"].isna().any()


def test_prediction_determinism(predictor, sample_data):
    row = sample_data.iloc[2]
    res_1 = predictor.predict_single(row)
    res_2 = predictor.predict_single(row)

    assert res_1["schedule_delay_probability"] == res_2["schedule_delay_probability"]
    assert res_1["cost_overrun_probability"] == res_2["cost_overrun_probability"]
    assert res_1["overall_risk_score"] == res_2["overall_risk_score"]


def test_current_data_predictions_file_exists_and_valid():
    pred_path = "reports/current_data_predictions.csv"
    assert os.path.exists(pred_path), f"Current predictions file missing at {pred_path}"

    df_preds = pd.read_csv(pred_path)
    assert len(df_preds) == 6228, f"Expected 6,228 records, got {len(df_preds)}"

    mandatory_cols = [
        "project_code", "prediction_timestamp", "schedule_delay_probability",
        "cost_overrun_probability", "overall_risk_score", "risk_level",
        "risk_trajectory", "risk_delta", "anomaly_status", "intervention_priority"
    ]
    for col in mandatory_cols:
        assert col in df_preds.columns, f"Mandatory column '{col}' missing from current data predictions"

    assert (df_preds["schedule_delay_probability"].between(0.0, 1.0)).all()
    assert (df_preds["cost_overrun_probability"].between(0.0, 1.0)).all()
    assert (df_preds["overall_risk_score"].between(0.0, 100.0)).all()
