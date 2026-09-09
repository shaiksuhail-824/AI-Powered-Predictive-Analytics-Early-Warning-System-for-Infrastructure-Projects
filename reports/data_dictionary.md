# SIH26103 — PAIMANA Time Overrun Dataset: Data Dictionary

**Generated**: 2026-09-09 17:14:54  
**Dataset**: `data/raw/paimana_time_overrun.csv` (Authoritative Source)  
**Scale**: 17,697 records across 38 attributes  
**Source**: Ministry of Statistics and Programme Implementation (MoSPI) - PAIMANA / OCMS  

## 1. Overview

This data dictionary provides comprehensive, dynamically computed field statistics for the authoritative PAIMANA Time Overrun ML dataset. Every missing-value rate, unique count, and numeric distribution is computed directly from the dataset without hardcoding.

## 2. Master Field Directory

| Field Name | Type | Description | Source | Example Value | Missing (%) | Unique | ML Role |
|---|---|---|---|---|---|---|---|
| `project_code` | `str` | Unique alphanumeric project identifier assigned by MoSPI PAIMANA system | MoSPI PAIMANA Master Project Directory | `060100093` | 0.0% | 3,531 | Entity ID / Grouping Key (Used for temporal and grouped cross-validation) |
| `report_year` | `int64` | Calendar year of the project monitoring snapshot (e.g. 2024, 2025, 2026) | Monthly Flash Report publication metadata | `2025` | 0.0% | 2 | Temporal Partition Key (Prevents chronological data leakage) |
| `report_month_num` | `int64` | Calendar month number of the snapshot (1 to 12) | Monthly Flash Report publication metadata | `4` | 0.0% | 11 | Temporal / Seasonal Feature (Monsoon, fiscal year-end March surge) |
| `agency_frequency` | `float64` | Normalized frequency encoding of the implementing agency across portfolio | Derived frequency feature from CPSE / Agency attribute | `0.0021136994143291` | 0.0% | 96 | Continuous Entity Feature (Agency portfolio scale and experience) |
| `state_frequency` | `float64` | Normalized frequency encoding of the project state / geographic jurisdiction | Derived frequency feature from State / UT attribute | `0.0066053106697785` | 0.0% | 93 | Continuous Spatial Feature (Regional project density and infrastructure activity) |
| `original_cost_cr` | `float64` | Originally sanctioned capital cost in Indian Crores (INR Crore) | Cabinet / CCEA approved initial sanction | `11816.4` | 0.0% | 2,750 | Core Financial Baseline (Project scale and denominator for financial ratios) |
| `cumulative_expenditure_cr` | `float64` | Cumulative financial expenditure incurred up to the reporting month (INR Crore) | Monthly utilization returns submitted to MoSPI | `6584.29` | 0.0% | 11,496 | Dynamic Financial Feature (Capital utilization velocity) |
| `physical_progress_pct` | `float64` | Reported cumulative physical works completion percentage (0.0% to 100.0%) | PMC / Engineer-in-Charge certified progress reports | `77.2` | 0.0% | 3,501 | Primary Dynamic Progress Indicator |
| `expenditure_to_original_cost_pct` | `float64` | Ratio of cumulative expenditure to original sanctioned cost expressed as percentage | Derived financial ratio (cumulative_expenditure / original_cost * 100) | `55.72162418333841` | 0.0% | 12,061 | Financial Risk Signal (>100% indicates budget overrun) |
| `expenditure_per_progress_pct_cr` | `float64` | Capital expenditure incurred per 1% of physical progress achieved (INR Cr / %) | Derived efficiency metric (cumulative_expenditure / physical_progress) | `0.721782696675368` | 0.0% | 13,073 | Burn-Rate Efficiency Signal (Detects abnormal cost escalation per work unit) |
| `remaining_original_cost_cr` | `float64` | Unspent sanctioned budget balance (original_cost - cumulative_expenditure) | Derived financial metric | `5232.11` | 0.0% | 12,272 | Financial Buffer Feature (Remaining fiscal headroom) |
| `approval_to_start_days` | `float64` | Calendar days elapsed between sanction approval and actual physical commencement | Derived timeline duration (start_date - approval_date) | `304.0` | 0.0% | 258 | Pre-construction Lag Feature (Land acquisition and tendering bottlenecks) |
| `planned_duration_days` | `float64` | Total planned execution duration in calendar days from start to original DOC | Derived timeline duration (original_doc - start_date) | `912.0` | 0.0% | 387 | Baseline Schedule Horizon (Complexity and scale of planned execution) |
| `elapsed_duration_days` | `float64` | Calendar days elapsed from physical start date to current reporting month | Derived temporal duration (report_month_date - start_date) | `1218.0` | 0.0% | 889 | Dynamic Lifecycle Stage Feature |
| `remaining_planned_days` | `float64` | Remaining calendar days until original planned completion date | Derived timeline duration (original_doc - report_month_date) | `-150.0` | 0.0% | 718 | Schedule Headroom Indicator |
| `elapsed_duration_pct` | `float64` | Percentage of planned duration already consumed (elapsed_days / planned_days * 100) | Derived schedule ratio | `111.7510630073444` | 0.0% | 6,365 | Schedule Burn Rate (>100% indicates schedule overdue) |
| `progress_per_elapsed_month` | `float64` | Average monthly physical progress rate achieved since commencement (%/month) | Derived velocity metric (physical_progress / elapsed_months) | `1.2412815626488802` | 0.0% | 10,302 | Progress Velocity Indicator (Early warning for stalled progress) |
| `schedule_progress_gap_pct` | `float64` | Gap between schedule consumption and physical completion (progress_pct - elapsed_duration_pct) | Derived slippage metric | `-50.64736645498692` | 0.0% | 11,825 | Primary Slippage Early Warning Metric |
| `report_year_missing` | `int64` | Binary missingness indicator flag for 'report_year' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 1 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `report_month_num_missing` | `int64` | Binary missingness indicator flag for 'report_month_num' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 1 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `agency_frequency_missing` | `int64` | Binary missingness indicator flag for 'agency_frequency' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 1 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `state_frequency_missing` | `int64` | Binary missingness indicator flag for 'state_frequency' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 1 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `original_cost_cr_missing` | `int64` | Binary missingness indicator flag for 'original_cost_cr' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 1 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `cumulative_expenditure_cr_missing` | `int64` | Binary missingness indicator flag for 'cumulative_expenditure_cr' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `physical_progress_pct_missing` | `int64` | Binary missingness indicator flag for 'physical_progress_pct' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `expenditure_to_original_cost_pct_missing` | `int64` | Binary missingness indicator flag for 'expenditure_to_original_cost_pct' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `expenditure_per_progress_pct_cr_missing` | `int64` | Binary missingness indicator flag for 'expenditure_per_progress_pct_cr' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `remaining_original_cost_cr_missing` | `int64` | Binary missingness indicator flag for 'remaining_original_cost_cr' (1 if missing, 0 if present) | Derived data engineering quality feature | `0` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `approval_to_start_days_missing` | `int64` | Binary missingness indicator flag for 'approval_to_start_days' (1 if missing, 0 if present) | Derived data engineering quality feature | `1` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `planned_duration_days_missing` | `int64` | Binary missingness indicator flag for 'planned_duration_days' (1 if missing, 0 if present) | Derived data engineering quality feature | `1` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `elapsed_duration_days_missing` | `int64` | Binary missingness indicator flag for 'elapsed_duration_days' (1 if missing, 0 if present) | Derived data engineering quality feature | `1` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `remaining_planned_days_missing` | `int64` | Binary missingness indicator flag for 'remaining_planned_days' (1 if missing, 0 if present) | Derived data engineering quality feature | `1` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `elapsed_duration_pct_missing` | `int64` | Binary missingness indicator flag for 'elapsed_duration_pct' (1 if missing, 0 if present) | Derived data engineering quality feature | `1` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `progress_per_elapsed_month_missing` | `int64` | Binary missingness indicator flag for 'progress_per_elapsed_month' (1 if missing, 0 if present) | Derived data engineering quality feature | `1` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `schedule_progress_gap_pct_missing` | `int64` | Binary missingness indicator flag for 'schedule_progress_gap_pct' (1 if missing, 0 if present) | Derived data engineering quality feature | `1` | 0.0% | 2 | Missingness Indicator Feature (Captures reporting incompleteness pattern) |
| `time_overrun_days` | `float64` | Total schedule slippage in calendar days (revised_doc - original_doc) | Official MoSPI schedule delay calculation | `1096.0` | 0.0% | 517 | Continuous Regression Target (Days of delay) |
| `time_overrun_months` | `float64` | Total schedule slippage normalized to calendar months (time_overrun_days / 30.4375) | Official MoSPI schedule delay reporting standard | `36.0082135523614` | 0.0% | 517 | Standard MoSPI Regression Target (Months of delay) |
| `time_overrun_flag` | `int64` | Binary ground-truth indicator of project schedule overrun (1 = delayed, 0 = on schedule) | Official MoSPI binary delay classification | `1` | 0.0% | 2 | Primary Binary Classification Target (Project Delay Classification) |

## 3. Statistical Distribution of Numerical Features

| Metric | Mean | Std Dev | Min | 25% | Median | 75% | Max |
|---|---|---|---|---|---|---|---|
| `report_year` | 2,025.55 | 0.5 | 2,025 | 2,025.0 | 2,026.0 | 2,026.0 | 2,026 |
| `report_month_num` | 5.44 | 2.64 | 1 | 4.0 | 5.0 | 7.0 | 12 |
| `agency_frequency` | 0.07 | 0.06 | 0.0 | 0.0 | 0.08 | 0.13 | 0.16 |
| `state_frequency` | 0.02 | 0.02 | 0.0 | 0.01 | 0.02 | 0.04 | 0.08 |
| `original_cost_cr` | 2,027.07 | 5,608.38 | 68.0 | 355.79 | 758.09 | 1,549.0 | 108,000.0 |
| `cumulative_expenditure_cr` | 1,434.12 | 5,780.09 | 0.0 | 106.16 | 326.2 | 893.28 | 124,623.0 |
| `physical_progress_pct` | 66.45 | 30.66 | 0.0 | 45.0 | 75.0 | 93.46 | 100.0 |
| `expenditure_to_original_cost_pct` | 61.14 | 137.92 | 0.0 | 19.81 | 50.65 | 81.4 | 10,333.77 |
| `expenditure_per_progress_pct_cr` | 1.2 | 13.29 | 0.0 | 0.51 | 0.76 | 1.06 | 1,600.4 |
| `remaining_original_cost_cr` | 592.78 | 3,798.93 | -87,468.62 | 94.57 | 286.21 | 708.94 | 41,790.0 |
| `approval_to_start_days` | 398.12 | 484.08 | 0.0 | 181.0 | 304.0 | 426.0 | 8,978.0 |
| `planned_duration_days` | 1,309.15 | 1,309.96 | 0.0 | 731.0 | 912.0 | 1,096.0 | 15,585.0 |
| `elapsed_duration_days` | 1,739.91 | 1,504.14 | 0.0 | 1,126.0 | 1,218.0 | 1,916.0 | 15,797.0 |
| `remaining_planned_days` | -382.25 | 898.28 | -7,762.0 | -608.0 | -150.0 | -91.0 | 11,445.0 |
| `elapsed_duration_pct` | 145.52 | 124.39 | 0.0 | 106.44 | 111.75 | 158.37 | 3,401.69 |
| `progress_per_elapsed_month` | 1.45 | 1.04 | 0.0 | 0.99 | 1.24 | 1.78 | 45.25 |
| `schedule_progress_gap_pct` | -80.31 | 117.88 | -3,354.69 | -83.19 | -50.65 | -42.51 | 79.58 |
| `time_overrun_days` | 645.32 | 925.37 | -10,837.0 | 0.0 | 393.0 | 915.0 | 9,131.0 |
| `time_overrun_months` | 21.2 | 30.4 | -356.04 | 0.0 | 12.91 | 30.06 | 299.99 |
| `time_overrun_flag` | 0.73 | 0.45 | 0 | 0.0 | 1.0 | 1.0 | 1 |

## 4. CUF vs Derived / Engineered Classification

### 4.1 CUF / Baseline Project Attributes (10 Fields)
- `project_code`: Unique identifier
- `report_year`, `report_month_num`: Temporal snapshot attributes
- `agency_frequency`, `state_frequency`: Spatial & Organizational identifiers
- `original_cost_cr`: Sanctioned budget
- `cumulative_expenditure_cr`: Incurred spend
- `physical_progress_pct`: Physical completion
- `approval_to_start_days`, `planned_duration_days`: Initial DPR schedule attributes

### 4.2 Derived & Engineered Features (8 Fields)
- `expenditure_to_original_cost_pct`: Capital consumption ratio
- `expenditure_per_progress_pct_cr`: Spend per percent of progress
- `remaining_original_cost_cr`: Remaining budget headroom
- `elapsed_duration_days`: Consumed project duration
- `remaining_planned_days`: Remaining planned timeline
- `elapsed_duration_pct`: Schedule burn-rate percentage
- `progress_per_elapsed_month`: Monthly delivery speed
- `schedule_progress_gap_pct`: Physical vs Schedule gap

### 4.3 Missingness Indicators (17 Fields)
- `report_year_missing` through `schedule_progress_gap_pct_missing`

### 4.4 Target Variables (3 Fields)
- `time_overrun_days`: Delay in days
- `time_overrun_months`: Delay in months
- `time_overrun_flag`: Delay binary indicator
