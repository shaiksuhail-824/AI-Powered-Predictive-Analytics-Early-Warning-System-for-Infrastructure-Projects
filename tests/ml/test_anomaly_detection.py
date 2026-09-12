"""
tests/ml/test_anomaly_detection.py - Anomaly Sentinel Verification Tests
Verifies Isolation Forest model outputs, decision categories, and decision-support compliance.
"""

import os
import pickle
import pytest
import numpy as np
import pandas as pd

from src.ml.anomaly_detection import (
    ANOMALY_FEATURE_COLUMNS, categorize_anomaly_score, score_anomalies
)


def test_categorize_anomaly_score_tiers():
    assert categorize_anomaly_score(0.12) == "NORMAL"
    assert categorize_anomaly_score(0.02) == "UNUSUAL"
    assert categorize_anomaly_score(-0.02) == "ANOMALOUS"
    assert categorize_anomaly_score(-0.15) == "REQUIRES_VERIFICATION"


def test_no_fraud_terminology_used():
    valid_categories = {"NORMAL", "UNUSUAL", "ANOMALOUS", "REQUIRES_VERIFICATION"}
    for cat in valid_categories:
        assert "fraud" not in cat.lower()
        assert "corruption" not in cat.lower()


def test_anomaly_model_artifact_exists_and_loads():
    artifact_path = "models/anomaly_detector/production_anomaly_detector.pkl"
    assert os.path.exists(artifact_path), f"Artifact missing: {artifact_path}"

    with open(artifact_path, "rb") as f:
        pkg = pickle.load(f)

    assert "pipeline" in pkg
    assert "feature_cols" in pkg
    assert len(pkg["feature_cols"]) > 0


def test_anomaly_scoring_on_synthetic_instance():
    artifact_path = "models/anomaly_detector/production_anomaly_detector.pkl"
    with open(artifact_path, "rb") as f:
        pkg = pickle.load(f)

    test_data = pd.DataFrame([{col: 10.0 for col in pkg["feature_cols"]}])
    scores, cats = score_anomalies(test_data, pkg)

    assert len(scores) == 1
    assert len(cats) == 1
    assert isinstance(scores[0], (float, np.floating))
    assert cats[0] in {"NORMAL", "UNUSUAL", "ANOMALOUS", "REQUIRES_VERIFICATION"}
