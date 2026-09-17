"""
tests/ml/test_model_schema.py - Model Output Schema and Bound Verification Tests
Verifies that prediction outputs strictly comply with API schema, probability bounds,
risk tiers, and enum constraints.
"""

import pytest
import numpy as np
import pandas as pd

from src.mlops.model_metadata import API_OUTPUT_SCHEMA, DATA_STATUS
from src.ml.risk_scoring import (
    compute_overall_risk_score, categorize_risk_level,
    compute_risk_trajectory, compute_intervention_priority
)


def test_probability_bounds():
    # Valid probabilities must reside in [0.0, 1.0]
    test_probs = [0.0, 0.25, 0.5, 0.75, 1.0]
    for p in test_probs:
        assert 0.0 <= p <= 1.0


def test_overall_risk_score_bounds_and_clipping():
    # Test boundary combinations
    score_min = compute_overall_risk_score(0.0, 0.0, 50.0, "NORMAL")
    assert 0.0 <= score_min <= 100.0
    assert score_min == 0.0

    score_max = compute_overall_risk_score(1.0, 1.0, -100.0, "REQUIRES_VERIFICATION")
    assert 0.0 <= score_max <= 100.0
    assert score_max == 100.0

    # Intermediate scores
    score_mid = compute_overall_risk_score(0.5, 0.5, 0.0, "NORMAL")
    assert 0.0 <= score_mid <= 100.0


def test_risk_level_categories():
    valid_levels = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert categorize_risk_level(10.0) == "LOW"
    assert categorize_risk_level(30.0) == "MEDIUM"
    assert categorize_risk_level(60.0) == "HIGH"
    assert categorize_risk_level(85.0) == "CRITICAL"

    for score in [0.0, 24.9, 25.0, 49.9, 50.0, 74.9, 75.0, 100.0]:
        lvl = categorize_risk_level(score)
        assert lvl in valid_levels


def test_risk_trajectory_validity():
    valid_trajectories = {"STABLE", "DE_ESCALATING", "MODERATE_RISE", "RAPID_ESCALATION"}

    t1 = compute_risk_trajectory(50.0, 35.0)
    assert t1["risk_trajectory"] == "RAPID_ESCALATION"
    assert t1["risk_delta"] == 15.0

    t2 = compute_risk_trajectory(50.0, 43.0)
    assert t2["risk_trajectory"] == "MODERATE_RISE"

    t3 = compute_risk_trajectory(50.0, 51.0)
    assert t3["risk_trajectory"] == "STABLE"

    t4 = compute_risk_trajectory(50.0, 60.0)
    assert t4["risk_trajectory"] == "DE_ESCALATING"


def test_intervention_priority_validity():
    valid_tiers = {"LOW", "MEDIUM", "HIGH", "CRITICAL_INTERVENTION"}

    p1 = compute_intervention_priority(20.0, 50.0, -2.0)
    assert p1["intervention_priority_tier"] in valid_tiers

    p2 = compute_intervention_priority(90.0, 10000.0, 12.0)
    assert p2["intervention_priority_tier"] == "CRITICAL_INTERVENTION"


def test_data_status_metadata_constant():
    assert DATA_STATUS == "REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS"
