# SIH26103 — CUF Feature Mapping & Comparative Architecture

**Generated**: 2026-09-09 17:19:38  
**Problem Statement**: SIH26103 — Performance comparison of existing CUF fields vs engineered variables  

## 1. CUF Comparison Framework

The MoSPI SIH26103 problem statement explicitly requires testing predictive accuracy using:
1. **Model A (CUF / Baseline Project Fields)**: Uses only traditional project-monitoring attributes recorded in standard Common Utility Format (CUF) tables.
2. **Model B (CUF + Engineered + Temporal + Velocity Features)**: Augments CUF with derived dynamic ratios, schedule-progress gaps, temporal velocity, and missingness signals.

## 2. Feature Architecture Mapping Matrix

| Feature Name | Model A (CUF Baseline) | Model B (Engineered / Extended) | Field Source | Predictive Rationale |
|---|:---:|:---:|---|---|
| `project_code` | [x] | [x] | CUF Master Register | Project grouping & cross-validation key |
| `report_year` | [x] | [x] | CUF Flash Header | Temporal cutoff timestamp |
| `report_month_num` | [x] | [x] | CUF Flash Header | Seasonal / fiscal period cycle |
| `agency_frequency` | [x] | [x] | Derived from CUF Agency | Implementing CPSE capacity weight |
| `state_frequency` | [x] | [x] | Derived from CUF State | Geographic jurisdiction activity weight |
| `original_cost_cr` | [x] | [x] | CUF Cost Sanction | Sanctioned scale |
| `cumulative_expenditure_cr` | [x] | [x] | CUF Expenditure | Incurred financial outlay |
| `physical_progress_pct` | [x] | [x] | CUF Progress Field | On-ground work completion |
| `approval_to_start_days` | [x] | [x] | CUF Timeline DPR | Pre-execution administrative delay |
| `planned_duration_days` | [x] | [x] | CUF Schedule Milestone | Approved project lifecycle duration |
| `expenditure_to_original_cost_pct` | [ ] | [x] | Engineered | Capital exhaustion ratio |
| `expenditure_per_progress_pct_cr` | [ ] | [x] | Engineered | Financial burn per unit progress |
| `remaining_original_cost_cr` | [ ] | [x] | Engineered | Remaining financial headroom |
| `elapsed_duration_days` | [ ] | [x] | Engineered Temporal | Actual elapsed execution days |
| `remaining_planned_days` | [ ] | [x] | Engineered Temporal | Remaining schedule buffer |
| `elapsed_duration_pct` | [ ] | [x] | Engineered | Schedule time consumption % |
| `progress_per_elapsed_month` | [ ] | [x] | Engineered Velocity | Physical milestone delivery speed |
| `schedule_progress_gap_pct` | [ ] | [x] | Engineered Slippage | Critical slippage indicator |
| `progress_delta_recent` | [ ] | [x] | Engineered Dynamic | Month-over-month progress delta |
| `expenditure_delta_recent` | [ ] | [x] | Engineered Dynamic | Month-over-month financial disbursement |
| `recent_spend_efficiency_cr_pct` | [ ] | [x] | Engineered Dynamic | Recent marginal spend rate per progress |
| Missingness Flags (16) | [ ] | [x] | Engineered Quality | Reporting incompleteness patterns |

## 3. Dataset Artifacts for ML Team
- **CUF Baseline Dataset**: `data/features/paimana_cuf_baseline.csv` (10 feature columns + targets)
- **Extended Feature Dataset**: `data/features/paimana_ml_ready_time_overrun.csv` (38 feature columns + targets)

The downstream ML team can benchmark baseline models (Logistic Regression, Random Forest on CUF) directly against extended models (LightGBM, XGBoost on Extended Features) to empirically demonstrate the predictive lift of feature engineering.
