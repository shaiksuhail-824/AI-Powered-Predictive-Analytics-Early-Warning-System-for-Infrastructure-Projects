"""
src/ml/risk_scoring.py - Standardized 0-100 Project Risk Scoring, Trajectory, and Intervention Priority
Computes deterministic multi-factor risk scores, dynamic risk trajectory, "What Changed?",
and transparent decision-support intervention rankings for government project monitors.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Union


def compute_overall_risk_score(delay_prob: float,
                               cost_prob: float,
                               schedule_progress_gap_pct: float,
                               anomaly_category: str,
                               config: dict = None) -> float:
    """
    Compute deterministic 0-100 standardized infrastructure risk score.
    Formula:
    Risk = 100 * (w_delay * P(delay) + w_cost * P(cost) + w_gap * NormGap + w_anom * AnomPenalty)
    """
    weights = config.get("risk_scoring", {}).get("weights", {}) if config else {}
    w_delay = weights.get("schedule_delay_prob", 0.40)
    w_cost = weights.get("cost_overrun_prob", 0.35)
    w_gap = weights.get("schedule_progress_gap", 0.15)
    w_anom = weights.get("anomaly_penalty", 0.10)

    # Normalize schedule progress gap: severe negative gap (-100%) maps to 1.0 risk, >= 0% maps to 0.0
    norm_gap = float(np.clip(-schedule_progress_gap_pct / 50.0, 0.0, 1.0))

    # Anomaly penalty mapping
    anom_penalties = {
        "NORMAL": 0.0,
        "UNUSUAL": 0.33,
        "ANOMALOUS": 0.66,
        "REQUIRES_VERIFICATION": 1.0
    }
    anom_factor = anom_penalties.get(str(anomaly_category).upper(), 0.0)

    raw_score = 100.0 * (
        (w_delay * float(delay_prob)) +
        (w_cost * float(cost_prob)) +
        (w_gap * norm_gap) +
        (w_anom * anom_factor)
    )

    return float(np.clip(round(raw_score, 1), 0.0, 100.0))


def categorize_risk_level(risk_score: float) -> str:
    """Classify 0-100 score into government standard monitoring tiers."""
    if risk_score < 25.0:
        return "LOW"
    elif risk_score < 50.0:
        return "MEDIUM"
    elif risk_score < 75.0:
        return "HIGH"
    else:
        return "CRITICAL"


def compute_risk_trajectory(risk_score_t: float,
                            risk_score_t_minus_1: float,
                            config: dict = None) -> Dict[str, Any]:
    """
    Compute dynamic momentum metrics: delta, velocity, and trajectory tier.
    Identifies RAPID RISK ESCALATION early.
    """
    if risk_score_t_minus_1 is None or np.isnan(risk_score_t_minus_1):
        return {
            "risk_delta": 0.0,
            "risk_velocity": 0.0,
            "risk_trajectory": "STABLE"
        }

    delta = float(round(risk_score_t - risk_score_t_minus_1, 1))
    # Standard monthly velocity assumes unit 1-month interval
    velocity = delta

    thresh = config.get("risk_scoring", {}).get("trajectory", {}) if config else {}
    rapid_thresh = thresh.get("rapid_escalation_delta", 10.0)
    moderate_thresh = thresh.get("moderate_rise_delta", 5.0)
    de_escalate_thresh = thresh.get("de_escalating_delta", -5.0)

    if delta >= rapid_thresh:
        trajectory = "RAPID_ESCALATION"
    elif delta >= moderate_thresh:
        trajectory = "MODERATE_RISE"
    elif delta <= de_escalate_thresh:
        trajectory = "DE_ESCALATING"
    else:
        trajectory = "STABLE"

    return {
        "risk_delta": delta,
        "risk_velocity": velocity,
        "risk_trajectory": trajectory
    }


def compute_what_changed(current_obs: dict, prev_obs: dict = None) -> Dict[str, Any]:
    """
    Calculate month-over-month administrative deltas supporting
    'WHAT CHANGED SINCE LAST MONTH?' dashboard views.
    """
    if not prev_obs:
        return {
            "progress_delta": 0.0,
            "expenditure_delta": 0.0,
            "cost_revision_delta": 0.0,
            "schedule_revision_delta": 0.0,
            "summary": "Initial baseline observation docket."
        }

    p_delta = float(round(current_obs.get("physical_progress_pct", 0.0) - prev_obs.get("physical_progress_pct", 0.0), 2))
    e_delta = float(round(current_obs.get("cumulative_expenditure_cr", 0.0) - prev_obs.get("cumulative_expenditure_cr", 0.0), 2))
    c_delta = float(round(current_obs.get("original_cost_cr", 0.0) - prev_obs.get("original_cost_cr", 0.0), 2))
    s_delta = float(round(current_obs.get("planned_duration_days", 0.0) - prev_obs.get("planned_duration_days", 0.0), 2))

    summary_items = []
    if p_delta > 0:
        summary_items.append(f"+{p_delta}% physical progress recorded")
    elif p_delta == 0:
        summary_items.append("Zero physical progress recorded (stagnation)")
    if e_delta > 0:
        summary_items.append(f"₹{e_delta} Cr disbursed")
    if c_delta != 0:
        summary_items.append(f"Sanctioned cost revised by ₹{c_delta} Cr")
    if s_delta != 0:
        summary_items.append(f"Planned schedule revised by {s_delta} days")

    return {
        "progress_delta": p_delta,
        "expenditure_delta": e_delta,
        "cost_revision_delta": c_delta,
        "schedule_revision_delta": s_delta,
        "summary": "; ".join(summary_items) if summary_items else "No significant parameter shift."
    }


def compute_intervention_priority(risk_score: float,
                                  original_cost_cr: float,
                                  risk_velocity: float,
                                  config: dict = None) -> Dict[str, Any]:
    """
    Compute transparent priority ranking: Priority = Risk * Impact * Urgency.
    Provides actionable decision support without asserting causal optimization claims.
    """
    weights = config.get("intervention_priority", {}).get("weights", {}) if config else {}
    w_risk = weights.get("risk_score", 0.50)
    w_cost = weights.get("cost_impact", 0.30)
    w_urgency = weights.get("urgency", 0.20)

    # 1. Normalized Risk factor [0, 1]
    f_risk = risk_score / 100.0

    # 2. Impact factor: Log-scale cost impact (₹100 Cr to ₹50,000 Cr scale)
    f_impact = float(np.clip(np.log10(max(original_cost_cr, 10.0) / 10.0) / 3.7, 0.1, 1.0))

    # 3. Urgency factor: Boosted by positive risk escalation velocity
    f_urgency = float(np.clip(0.5 + (risk_velocity / 20.0), 0.1, 1.0))

    priority_index = 100.0 * ((w_risk * f_risk) + (w_cost * f_impact) + (w_urgency * f_urgency))
    priority_index = float(np.clip(round(priority_index, 1), 0.0, 100.0))

    if priority_index < 30.0:
        tier = "LOW"
    elif priority_index < 55.0:
        tier = "MEDIUM"
    elif priority_index < 75.0:
        tier = "HIGH"
    else:
        tier = "CRITICAL_INTERVENTION"

    return {
        "intervention_priority_index": priority_index,
        "intervention_priority_tier": tier,
        "factors": {
            "risk_component": round(f_risk, 3),
            "impact_component": round(f_impact, 3),
            "urgency_component": round(f_urgency, 3)
        }
    }
