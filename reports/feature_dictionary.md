# SIH26103 — Feature Dictionary & Engineering Logic

**Generated**: 2026-09-09 17:19:38  
**Target Model Context**: Infrastructure Project Time Overrun & Early Warning System (MoSPI)  
**Feature Matrix**: `data/features/paimana_ml_ready_time_overrun.csv` (17,697 rows, 41 attributes)  

## 1. Feature Categories & Definitions

| Feature Name | Category | Mathematical Definition / Logic | Input Fields | Analytical / Early-Warning Rationale |
|---|---|---|---|---|
| `original_cost_cr` | Financial Baseline | Initial sanctioned project cost | Sanction Order | Scale factor; larger projects typically carry higher coordination friction. |
| `cumulative_expenditure_cr` | Financial Progress | Cumulative funds disbursed | Utilization Certificates | Measures financial capital deployment. |
| `expenditure_to_original_cost_pct` | Financial Ratio | `(expenditure / original_cost) * 100` | Spend & Sanction | Identifies premature budget depletion before project delivery. |
| `expenditure_per_progress_pct_cr` | Efficiency / Intensity | `expenditure / physical_progress` | Spend & Progress | Capital intensity per unit progress; abnormal surges indicate cost creep. |
| `remaining_original_cost_cr` | Financial Headroom | `original_cost - expenditure` | Cost & Spend | Unspent fiscal buffer. Negative values signify cost overrun. |
| `approval_to_start_days` | Pre-construction Lag | `start_date - approval_date` | Sanction & Start Dates | Long lags highlight early land acquisition or tendering friction. |
| `planned_duration_days` | Schedule Horizon | `original_doc - start_date` | DPR Schedule | Baseline duration approved by sanctioning authority. |
| `elapsed_duration_days` | Temporal Lifecycle | `report_date - start_date` | Calendar Timeline | Age of active project implementation. |
| `remaining_planned_days` | Schedule Buffer | `original_doc - report_date` | Target Date & Time T | Days remaining; negative values reveal project has overshot planned DOC. |
| `elapsed_duration_pct` | Schedule Consumption | `(elapsed_days / planned_days) * 100` | Timeline Dockets | Schedule burn rate. >100% means schedule is expired. |
| `physical_progress_pct` | Physical Milestone | Cumulative completed percentage | Certified Inspection | Primary metric of actual on-ground physical delivery. |
| `progress_per_elapsed_month` | Delivery Velocity | `physical_progress / elapsed_months` | Progress & Age | Average delivery rate. Low values flag chronic project sluggishness. |
| `schedule_progress_gap_pct` | Core Slippage Signal | `physical_progress - elapsed_duration_pct` | Progress & Duration | High negative gap is the single most potent early warning of delay. |
| `progress_delta_recent` | Dynamic Velocity | `progress(T) - progress(T-1)` | Temporal Observations | Detects sudden stalls or physical work stoppages between months. |
| `expenditure_delta_recent` | Dynamic Spend | `spend(T) - spend(T-1)` | Temporal Observations | Detects surges in monthly billings and cash disbursements. |
| `recent_spend_efficiency_cr_pct`| Marginal Efficiency | `spend_delta / progress_delta` | Delta Metrics | Marginal cost of recent milestone progress. |
| `agency_frequency` | Entity Representation | Portfolio frequency of implementing CPSE | Implementing Agency | Captures executing agency portfolio scale and experience. |
| `state_frequency` | Spatial Representation | Portfolio frequency of state/UT | State Location | Captures regional infrastructure volume and regulatory environment. |
| `time_overrun_days` | Regression Target | `revised_doc - original_doc` (in days) | Actual Milestones | Ground-truth continuous schedule delay in calendar days. |
| `time_overrun_months` | Regression Target | `time_overrun_days / 30.4375` | MoSPI Standard | Official MoSPI monthly delay metric for predictive modeling. |
| `time_overrun_flag` | Classification Target | `1 if delay > threshold else 0` | Delay Status | Binary classification label for high-risk early warning detection. |

## 2. Missingness Indicator Features (16 Flags)
Every numerical input contains a corresponding boolean missingness indicator (`_missing` suffix):
- Captures systematic non-reporting or missing milestone data as a legitimate predictive signal rather than losing records to drop-list deletion.
- Allows tree-based and linear models to separate true zero values from unrecorded administrative inputs.
