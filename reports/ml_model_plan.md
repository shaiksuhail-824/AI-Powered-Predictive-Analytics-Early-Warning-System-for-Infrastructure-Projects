# SIH26103 — ML & MLOps Production Architecture Plan

**Document ID**: `MOSPI-PAIMANA-ML-001`  
**Problem Statement**: SIH26103 — AI-Powered Predictive Analytics and Early Warning System for Infrastructure Projects (PAIMANA / MoSPI)  
**System Version**: `v1.0.0`  
**Data Status**: `REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS`  

---

> [!IMPORTANT]
> **Data Status Notice**: The dataset uses **REAL DATA SOURCED FROM PAIMANA PROJECT REPORTS** (3,531 projects, 17,697 longitudinal observations). Predictive analytics and early warning signals are generated to assist infrastructure project monitoring.

---

## 1. Executive Summary & Problem Context
The Ministry of Statistics and Programme Implementation (MoSPI) monitors central infrastructure projects sanctioned at ₹150 Crore and above via the PAIMANA (Projects Appraisal, Information Management and Analytics Network) / OCMS platform. Chronic time and cost overruns across linear (railways, highways) and node-based (power plants, refineries, ports) infrastructure lead to massive fiscal misallocation.

This Phase 1 Machine Learning pipeline implements an end-to-end, reproducible, leakage-free, and time-aware early warning system that predicts:
1. **Future Schedule Delay** (`future_schedule_delay`) at time $T+1$.
2. **Future Cost Overrun** (`future_cost_overrun`) at time $T+1$.
3. **Standardized 0–100 Overall Project Risk Score** (`overall_risk_score`).
4. **Dynamic Risk Trajectory** (`risk_delta`, `risk_velocity`, `risk_acceleration`).
5. **Project-Level Anomaly & Data Integrity Signals** via an unsupervised Isolation Forest sentinel.

---

## 2. Supervised Target Formulations

### Target A: Future Schedule Delay (`future_schedule_delay`)
* **Mathematical Definition**:
  $$y_{\text{delay}}(T) = \begin{cases} 1, & \text{if } \text{time\_overrun\_months}(T+1) \ge 1.0 \text{ or } \text{time\_overrun\_flag}(T+1) == 1 \\ 0, & \text{otherwise} \end{cases}$$
* **Threshold**: 1.0 calendar month of schedule slippage.
* **Leakage Safeguard**: Features at time $T$ include only backward-looking or instantaneous progress and schedule metrics. Under no circumstances are future milestones, anticipated completion dates post-$T$, or future slippages fed to the feature matrix.

### Target B: Future Cost Overrun (`future_cost_overrun`)
* **Mathematical Definition**:
  $$y_{\text{cost}}(T) = \begin{cases} 1, & \text{if } \text{cumulative\_expenditure\_cr}(T+1) > \text{original\_cost\_cr}(T) \\ 0, & \text{otherwise} \end{cases}$$
* **Threshold**: Cumulative expenditure exceeding $100\%$ of original sanctioned project cost.
* **Leakage Safeguard**: Final revised cost (`revised_cost_cr`), revised sanctions, and future expenditure increments are strictly excluded from predictive inputs $X(T)$.

---

## 3. Time-Aware Validation Strategy

Longitudinal project monitoring exhibits strong temporal correlation and macroeconomic cycles. Standard random splitting (`train_test_split`) creates catastrophic temporal leakage by training on future observations to predict past projects.

### Chronological Data Partitions
| Partition | Temporal Window | Observation Count | Purpose |
|---|---|---|---|
| **Historical Training** | 2025-04 to 2025-11 | 5,329 records | Model fitting, parameter estimation |
| **Historical Validation** | 2025-12 to 2026-01 | 1,790 records | Hyperparameter selection, model comparison |
| **Historical Holdout Test**| 2026-02 to 2026-03 | 2,538 records | Final unbiased performance verification |
| **Current Inference Set** | 2026-04 to 2026-07 | 6,228 records | Live unobserved deployment simulation |

*Invariant*: $\max(\text{Date}_{\text{train}}) < \min(\text{Date}_{\text{val}}) < \min(\text{Date}_{\text{test}}) < \min(\text{Date}_{\text{current}})$.

---

## 4. Controlled Model Zoo & Benchmarks
For both Target A and Target B, three algorithm families are trained across two distinct feature architectures:

1. **Baseline 1 — Logistic Regression**:
   - Standardized features, L2 regularization, `class_weight='balanced'`.
   - Serves as the transparent statistical benchmark required for government audits.
2. **Baseline 2 — Random Forest Classifier**:
   - Ensemble of 150 decision trees, `max_depth=8`, `min_samples_split=5`, `class_weight='balanced'`.
   - Models non-linear interactions without strong parametric assumptions.
3. **Candidate 3 — XGBoost Classifier**:
   - Gradient boosted trees, `n_estimators=150`, `max_depth=5`, `learning_rate=0.05`, `scale_pos_weight` tuned to class prevalence.
   - Captures subtle multi-feature thresholds and probability calibration.

### Feature Architectures
- **Model A (CUF Baseline)**: 10 traditional project fields (`original_cost_cr`, `cumulative_expenditure_cr`, `physical_progress_pct`, `approval_to_start_days`, `planned_duration_days`, frequency weights).
- **Model B (Enhanced ML)**: 48 attributes including dynamic progress velocities, schedule-progress gap, marginal efficiencies, expenditure burn rates, and 16 missingness indicators.
