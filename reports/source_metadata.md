# SIH26103 — Data Source Provenance & Ingestion Report

**Generated**: 2026-09-09 17:19:24  
**Source Authority**: Ministry of Statistics and Programme Implementation (MoSPI)  
**Platform**: PAIMANA (Projects Appraisal, Information Management and Analytics Network) / OCMS  
**Designated Dataset**: `PAIMANA_Time_Overrun_ML_dataset (1).csv` (Exclusive Source)  

---

## 1. Immutable Raw Dataset

| Attribute | Value |
|---|---|
| **Raw File Path** | `data/raw/paimana_time_overrun.csv` |
| **Original Source Path** | `C:\Users\varsh\Downloads\PAIMANA_Time_Overrun_ML_dataset (1).csv` |
| **File Size** | 4.4 MB (4,502.85 KB) |
| **Total Rows** | 17,697 |
| **Total Columns** | 38 |
| **SHA256 Checksum** | `394d7a3987e0684837abfd1d36f40a1be86ec9d6d128878e273f3ccf62c2358c` |
| **DVC Tracking Status** | Versioned under DVC (`data/raw/paimana_time_overrun.csv.dvc`) |
| **Immutability Guarantee**| Read-only source layer; transformations produced in `data/interim/`, `data/processed/`, `data/features/` |

---

## 2. Ingested Attributes Summary (38 Columns)

- **Entity & Temporal Keys**: `project_code`, `report_year`, `report_month_num`
- **Entity Frequency Weights**: `agency_frequency`, `state_frequency`
- **Sanction & Capital Metrics**: `original_cost_cr`, `cumulative_expenditure_cr`, `remaining_original_cost_cr`, `expenditure_to_original_cost_pct`, `expenditure_per_progress_pct_cr`
- **Schedule & Duration Metrics**: `approval_to_start_days`, `planned_duration_days`, `elapsed_duration_days`, `remaining_planned_days`, `elapsed_duration_pct`
- **Progress & Gap Indicators**: `physical_progress_pct`, `progress_per_elapsed_month`, `schedule_progress_gap_pct`
- **Missing Value Indicators (15 flags)**: `report_year_missing` ... `schedule_progress_gap_pct_missing`
- **Ground Truth Target Variables (3)**:
  - `time_overrun_days` (Continuous delay in calendar days)
  - `time_overrun_months` (Continuous delay normalized to months)
  - `time_overrun_flag` (Binary classification target: 1 = delayed, 0 = on schedule)
