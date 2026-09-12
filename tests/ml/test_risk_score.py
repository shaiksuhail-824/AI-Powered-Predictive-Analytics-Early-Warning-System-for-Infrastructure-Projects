"""
tests/ml/test_risk_score.py - Risk Scoring, Trajectory, and Priority Tests
Verifies mathematical determinism, monotonicity, and categorization invariants.
"""

import pytest
import numpy as np

from src.ml.risk_scoring import (
    compute_overall_risk_score, categorize_risk_level,
    compute_risk_trajectory, compute_what_changed, compute_intervention_priority
)


def test_risk_score_is_deterministic():
    # Calling the function multiple times with identical inputs must yield exact same output
    score_1 = compute_overall_risk_score(0.72, 0.45, -20.0, "NORMAL")
    score_2 = compute_overall_risk_score(0.72, 0.45, -20.0, "NORMAL")
    assert score_1 == score_2


def test_risk_score_monotonicity_delay_probability():
    score_low = compute_overall_risk_score(0.1, 0.3, 0.0, "NORMAL")
    score_high = compute_overall_risk_score(0.9, 0.3, 0.0, "NORMAL")
    assert score_high > score_low, "Increasing delay probability must strictly increase overall risk score"


def test_risk_score_monotonicity_cost_probability():
    score_low = compute_overall_risk_score(0.5, 0.1, 0.0, "NORMAL")
    score_high = compute_overall_risk_score(0.5, 0.9, 0.0, "NORMAL")
    assert score_high > score_low, "Increasing cost probability must strictly increase overall risk score"


def test_risk_score_monotonicity_slippage_gap():
    # Negative gap indicates slippage; more negative should increase risk
    score_healthy = compute_overall_risk_score(0.5, 0.5, 10.0, "NORMAL")
    score_slipping = compute_overall_risk_score(0.5, 0.5, -40.0, "NORMAL")
    assert score_slipping > score_healthy, "Negative progress gap must increase risk score"


def test_trajectory_velocity_and_acceleration():
    traj_escalating = compute_risk_trajectory(75.0, 60.0)
    assert traj_escalating["risk_trajectory"] == "RAPID_ESCALATION"
    assert traj_escalating["risk_delta"] == 15.0

    traj_stable = compute_risk_trajectory(50.0, 51.0)
    assert traj_stable["risk_trajectory"] == "STABLE"

    traj_deescalating = compute_risk_trajectory(40.0, 52.0)
    assert traj_deescalating["risk_trajectory"] == "DE_ESCALATING"


def test_what_changed_month_over_month():
    curr = {
        "physical_progress_pct": 45.0,
        "cumulative_expenditure_cr": 250.0,
        "original_cost_cr": 500.0,
        "planned_duration_days": 720.0
    }
    prev = {
        "physical_progress_pct": 40.0,
        "cumulative_expenditure_cr": 210.0,
        "original_cost_cr": 500.0,
        "planned_duration_days": 720.0
    }
    deltas = compute_what_changed(curr, prev)
    assert deltas["progress_delta"] == 5.0
    assert deltas["expenditure_delta"] == 40.0
    assert "progress" in deltas["summary"].lower()
