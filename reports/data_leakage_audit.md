# SIH26103 — Data Leakage Prevention Audit Report

**Generated**: 2026-09-09 17:19:38  
**Authority**: Ministry of Statistics and Programme Implementation (MoSPI)  
**Dataset Assessed**: `data/features/paimana_ml_ready_time_overrun.csv`  

## 1. Core Data Leakage Invariant

> **First-Class Engineering Rule**: For every predictive feature $X$, was the value strictly known and available at observation time $T$?
> If a value incorporates information determined after time $T$, it constitutes **target leakage** and must be barred from model training.

## 2. Field-by-Field Temporal Availability Audit

| Column Name | Category | Available at Time T? | Temporal Justification & Leakage Safeguard | Decision |
|---|---|:---:|---|:---:|
| `project_code` | Identifier | Yes | Fixed at project inception | APPROVED |
| `report_year` | Timestamp | Yes | Snapshot publication year | APPROVED |
| `report_month_num` | Timestamp | Yes | Snapshot observation month index | APPROVED |
| `agency_frequency` | Frequency | Yes | Computed across historical portfolio | APPROVED |
| `state_frequency` | Frequency | Yes | Computed across historical portfolio | APPROVED |
| `original_cost_cr` | Baseline | Yes | Determined at initial CCEA sanction approval | APPROVED |
| `cumulative_expenditure_cr`| Dynamic Spend | Yes | Cumulative spend booked up to report month T | APPROVED |
| `physical_progress_pct` | Dynamic Progress| Yes | Certified progress achieved up to month T | APPROVED |
| `expenditure_to_original_cost_pct`| Ratio | Yes | Function solely of spend(T) and original_cost | APPROVED |
| `expenditure_per_progress_pct_cr` | Ratio | Yes | Function solely of spend(T) and progress(T) | APPROVED |
| `remaining_original_cost_cr`| Ratio | Yes | Function solely of original_cost and spend(T) | APPROVED |
| `approval_to_start_days` | Timeline | Yes | Fixed once project commencement occurs | APPROVED |
| `planned_duration_days` | Timeline | Yes | Determined in sanctioned Detailed Project Report | APPROVED |
| `elapsed_duration_days` | Lifecycle | Yes | Calendar days elapsed from start to time T | APPROVED |
| `remaining_planned_days` | Lifecycle | Yes | Calendar days from time T to original DOC | APPROVED |
| `elapsed_duration_pct` | Ratio | Yes | Ratio of elapsed days to planned days at time T | APPROVED |
| `progress_per_elapsed_month` | Velocity | Yes | Cumulative progress achieved divided by elapsed months | APPROVED |
| `schedule_progress_gap_pct` | Velocity | Yes | Difference between progress(T) and elapsed_pct(T) | APPROVED |
| `progress_delta_recent` | Dynamic | Yes | Backward-looking delta: `progress(T) - progress(T-1)` | APPROVED |
| `expenditure_delta_recent` | Dynamic | Yes | Backward-looking delta: `spend(T) - spend(T-1)` | APPROVED |
| `recent_spend_efficiency_cr_pct` | Dynamic | Yes | Backward-looking ratio of recent deltas | APPROVED |
| Missingness Flags (16) | Indicators | Yes | Evaluated strictly on data state at time T | APPROVED |
| `time_overrun_days` | Target | NO (Target) | Excluded from feature inputs $X$; used as ground-truth target $y$ only | TARGET ONLY |
| `time_overrun_months` | Target | NO (Target) | Excluded from feature inputs $X$; used as ground-truth target $y$ only | TARGET ONLY |
| `time_overrun_flag` | Target | NO (Target) | Excluded from feature inputs $X$; used as ground-truth target $y$ only | TARGET ONLY |

## 3. High-Risk Fields Excluded from Features
The following fields from raw monitoring reports were audited and deliberately **excluded** from candidate predictive features:
1. **Final Revised Cost (`revised_cost_cr`)**: Only approved post-overrun; using it to predict overrun at early stages would leak the final budget outcome.
2. **Final Completion Date (`revised_doc_dt` at completion)**: Future outcome date; using final revised completion at time $T_0$ causes severe target leakage.
3. **Anticipated Completion after Time T**: Future revisions made after the report date are blocked.

## 4. Leakage Audit Conclusion
The feature matrix `data/features/paimana_ml_ready_time_overrun.csv` is **100% compliant** with the anti-leakage principle. All inputs $X$ represent backward-looking or instantaneous project metrics available to a project officer at time $T$.
