# SIH26103 — Current Data (April–July 2026) Inference Report

**Document ID**: `MOSPI-PAIMANA-ML-007`  
**Problem Statement**: SIH26103 — AI-Powered Predictive Analytics and Early Warning System for Infrastructure Projects (PAIMANA / MoSPI)  
**System Version**: `v1.0.0`  
**Data Status**: `SYNTHETIC / DEMONSTRATION`  

---

> [!IMPORTANT]
> **Data Status & Supervised Evaluation Notice**: The April–July 2026 PAIMANA observations do NOT possess observed future ground-truth milestone outcomes. Per Section 17 of the project specification, they are strictly treated as **CURRENT / UNSEEN INFERENCE DATA**. They were NOT included in the training or validation splits to prevent forward temporal leakage.

---

## 1. Scope & Execution Overview

The production inference pipeline (`src/ml/predict.py`) was executed on the full 4-month current observation window:
- **Temporal Horizon**: April 2026, May 2026, June 2026, July 2026
- **Total Inferred Observations**: $6,228$ records
- **Unique Central Infrastructure Projects**: $1,719$ projects
- **Generated Prediction File**: `reports/current_data_predictions.csv` (and mirrored to `data/processed/paimana_current_data_predictions.csv`)

For every project observation, the inference engine computed:
1. `schedule_delay_probability` via `Schedule_Delay_Predictor`
2. `cost_overrun_probability` via `Cost_Overrun_Predictor`
3. `anomaly_status` via `Project_Anomaly_Sentinel`
4. `overall_risk_score` (0–100 standardized scale)
5. `risk_level` (LOW, MEDIUM, HIGH, CRITICAL)
6. `risk_trajectory` (STABLE, DE_ESCALATING, MODERATE_RISE, RAPID_ESCALATION)
7. `risk_delta` (month-over-month shift)
8. `intervention_priority` (LOW, MEDIUM, HIGH, CRITICAL_INTERVENTION)
9. `top_risk_driver` (primary SHAP causal contributor)

---

## 2. Inferred Portfolio Distribution Summary

```text
                        CURRENT PORTFOLIO RISK PROFILE
                        (6,228 Observations / 1,719 Projects)

   RISK LEVEL                  RISK TRAJECTORY              INTERVENTION PRIORITY
   ──────────────────          ────────────────────────     ─────────────────────────────
   CRITICAL :  615 ( 9.9%)     RAPID ESCALATION :  165      CRITICAL INTERVENTION :  204
   HIGH     : 3,684 (59.1%)    MODERATE RISE    :  164      HIGH PRIORITY         : 1,638
   MEDIUM   :  568 ( 9.1%)     STABLE           : 5,713     MEDIUM PRIORITY       : 3,544
   LOW      : 1,361 (21.9%)    DE-ESCALATING    :  186      LOW PRIORITY          :  842
```

### Key Highlights:
- **Average Portfolio Risk Score**: $48.21$ on the 0–100 standardized scale.
- **Urgent Action Cohort**: **$204$ project records** flagged as `CRITICAL_INTERVENTION`, demanding immediate executive escalation.
- **Rapid Risk Escalators**: **$165$ project observations** transitioned with risk delta $\ge +10.0$, indicating sudden execution bottlenecks or financial surges.
- **Data Integrity Sentinel**: **$257$ records** classified as `REQUIRES_VERIFICATION` due to severe discordance between reported physical progress and cumulative disbursements.

---

## 3. Sample High-Priority Project Alerts (July 2026 Snapshot)

| Project Code | Observation Month | Overall Risk Score | Risk Level | Trajectory | Risk Delta | Anomaly Status | Intervention Tier | Primary Risk Driver |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **`400010`** | 2026-07 | **86.4** | `CRITICAL` | `RAPID_ESCALATION` | $+11.2$ | `ANOMALOUS` | `CRITICAL_INTERVENTION` | `schedule_progress_gap_pct` |
| **`400012`** | 2026-07 | **82.1** | `CRITICAL` | `RAPID_ESCALATION` | $+14.5$ | `NORMAL` | `CRITICAL_INTERVENTION` | `expenditure_burn_rate` |
| **`400023`** | 2026-07 | **78.5** | `CRITICAL` | `MODERATE_RISE` | $+6.8$ | `UNUSUAL` | `HIGH` | `schedule_progress_gap_pct` |
| **`400054`** | 2026-07 | **54.2** | `HIGH` | `STABLE` | $+0.4$ | `REQUIRES_VERIFICATION`| `HIGH` | `recent_spend_efficiency_cr_pct`|
| **`400188`** | 2026-07 | **12.4** | `LOW` | `STABLE` | $-1.1$ | `NORMAL` | `LOW` | `physical_progress_pct` |

---

## 4. Operational Ingestion Instructions for Next Phase (FastAPI)
The generated dataset `reports/current_data_predictions.csv` is fully compliant with the production API output contract. When the FastAPI backend service is constructed in the subsequent phase:
- It can directly query or pre-load `reports/current_data_predictions.csv` for millisecond dashboard responses.
- It can invoke `PAIMANAPredictor.predict_single()` for real-time what-if scenario simulations.
