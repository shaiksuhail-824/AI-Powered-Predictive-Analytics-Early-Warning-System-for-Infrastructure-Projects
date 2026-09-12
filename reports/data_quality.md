# SIH26103 — Data Quality & Validation Audit Report

**Audit Execution Time**: 2026-09-09 17:19:26  
**Authority**: Ministry of Statistics and Programme Implementation (MoSPI)  
**Source**: `data/raw/paimana_time_overrun.csv`  
**Validated Artifact**: `data/interim/paimana_time_overrun_validated.csv`  
**Quality Gate Status**: **PASSED**  

## 1. Executive Quality Scorecard

| Quality Dimension | Standard / Invariant | Observed Metric | Status |
|---|---|---|---|
| **Schema Integrity** | All 38 required columns present | Missing: 0 | PASSED |
| **Row Uniqueness** | Exact duplicate rows = 0 | 0 | PASSED |
| **Temporal Key Integrity** | Duplicate `(project_code, year, month)` | 0 | Verified |
| **Financial Validity** | Non-negative sanctioned costs (`original_cost >= 0`) | Violations: 0 | PASSED |
| **Expenditure Validity** | Non-negative expenditure (`expenditure >= 0`) | Violations: 0 | PASSED |
| **Progress Range** | Physical progress bounded in `[0.0%, 100.0%]` | Out of bounds: 0 | PASSED |
| **Target Consistency** | Target delay flag binary in `(0, 1)` | Invalid values: 0 | PASSED |
| **Temporal Scope** | Observation Years & Months | Years: [2025, 2026], Months: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12] | PASSED |

## 2. Target Variable Distribution (Ground Truth)

- **Total Validated Records**: 17,697
- **Delayed Projects (`time_overrun_flag == 1`)**: 12,849 (72.61%)
- **On-Schedule Projects (`time_overrun_flag == 0`)**: 4,848 (27.39%)

## 3. Attribute Null and Missingness Breakdown

All statistics below are computed directly from `data/raw/paimana_time_overrun.csv` with zero hardcoding.

| Attribute Name | Data Type | Missing Count | Missing Rate (%) | Indicator Alignment |
|---|---|---|---|---|
| `project_code` | `str` | 0 | 0.0% | Direct / Flag Field |
| `report_year` | `int64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `report_month_num` | `int64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `agency_frequency` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `state_frequency` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `original_cost_cr` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `cumulative_expenditure_cr` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `physical_progress_pct` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `expenditure_to_original_cost_pct` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `expenditure_per_progress_pct_cr` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `remaining_original_cost_cr` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `approval_to_start_days` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `planned_duration_days` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `elapsed_duration_days` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `remaining_planned_days` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `elapsed_duration_pct` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `progress_per_elapsed_month` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `schedule_progress_gap_pct` | `float64` | 0 | 0.0% | Yes (Has `_missing` flag) |
| `report_year_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `report_month_num_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `agency_frequency_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `state_frequency_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `original_cost_cr_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `cumulative_expenditure_cr_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `physical_progress_pct_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `expenditure_to_original_cost_pct_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `expenditure_per_progress_pct_cr_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `remaining_original_cost_cr_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `approval_to_start_days_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `planned_duration_days_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `elapsed_duration_days_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `remaining_planned_days_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `elapsed_duration_pct_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `progress_per_elapsed_month_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `schedule_progress_gap_pct_missing` | `int64` | 0 | 0.0% | Direct / Flag Field |
| `time_overrun_days` | `float64` | 0 | 0.0% | Direct / Flag Field |
| `time_overrun_months` | `float64` | 0 | 0.0% | Direct / Flag Field |
| `time_overrun_flag` | `int64` | 0 | 0.0% | Direct / Flag Field |

## 4. Invariant Checks Summary
- **Original Sanction Cost Negative Count**: 0
- **Cumulative Expenditure Negative Count**: 0
- **Physical Progress Out of Range [0, 100] Count**: 0
- **Negative Time Overrun Days Count**: 498
- **Invalid Target Flag Values**: 0

## 5. Conclusion & Preprocessing Directives
1. **Immutability Maintained**: Raw dataset remains unaltered at `data/raw/paimana_time_overrun.csv`.
2. **Interim Baseline Prepared**: Clean validated data stored at `data/interim/paimana_time_overrun_validated.csv`.
3. **Missing Value Architecture**: Missing values in numerical variables have explicit dual representation (`_missing` flags), preserving valuable non-reporting signals for MLOps modeling.
