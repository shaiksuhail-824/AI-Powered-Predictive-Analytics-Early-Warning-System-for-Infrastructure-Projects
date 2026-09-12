"""
src/data/make_data_dictionary.py
Calculates exact field statistics from data/raw/paimana_time_overrun.csv (17,697 rows, 38 columns)
and generates reports/data_dictionary.md with zero hardcoding.
"""

import os
import pandas as pd
from datetime import datetime

# Domain mapping for all 38 columns
COLUMN_METADATA = {
    "project_code": {
        "description": "Unique alphanumeric project identifier assigned by MoSPI PAIMANA system",
        "source": "MoSPI PAIMANA Master Project Directory",
        "transformation": "Cast to string, alphanumeric format validation",
        "ml_role": "Entity ID / Grouping Key (Used for temporal and grouped cross-validation)",
    },
    "report_year": {
        "description": "Calendar year of the project monitoring snapshot (e.g. 2024, 2025, 2026)",
        "source": "Monthly Flash Report publication metadata",
        "transformation": "Parsed integer year",
        "ml_role": "Temporal Partition Key (Prevents chronological data leakage)",
    },
    "report_month_num": {
        "description": "Calendar month number of the snapshot (1 to 12)",
        "source": "Monthly Flash Report publication metadata",
        "transformation": "Parsed integer month index (1=Jan, 12=Dec)",
        "ml_role": "Temporal / Seasonal Feature (Monsoon, fiscal year-end March surge)",
    },
    "agency_frequency": {
        "description": "Normalized frequency encoding of the implementing agency across portfolio",
        "source": "Derived frequency feature from CPSE / Agency attribute",
        "transformation": "Count of projects under implementing agency divided by total projects",
        "ml_role": "Continuous Entity Feature (Agency portfolio scale and experience)",
    },
    "state_frequency": {
        "description": "Normalized frequency encoding of the project state / geographic jurisdiction",
        "source": "Derived frequency feature from State / UT attribute",
        "transformation": "Count of projects in state divided by total projects",
        "ml_role": "Continuous Spatial Feature (Regional project density and infrastructure activity)",
    },
    "original_cost_cr": {
        "description": "Originally sanctioned capital cost in Indian Crores (INR Crore)",
        "source": "Cabinet / CCEA approved initial sanction",
        "transformation": "Continuous float conversion, non-negative validation",
        "ml_role": "Core Financial Baseline (Project scale and denominator for financial ratios)",
    },
    "cumulative_expenditure_cr": {
        "description": "Cumulative financial expenditure incurred up to the reporting month (INR Crore)",
        "source": "Monthly utilization returns submitted to MoSPI",
        "transformation": "Continuous float conversion, non-negative validation",
        "ml_role": "Dynamic Financial Feature (Capital utilization velocity)",
    },
    "physical_progress_pct": {
        "description": "Reported cumulative physical works completion percentage (0.0% to 100.0%)",
        "source": "PMC / Engineer-in-Charge certified progress reports",
        "transformation": "Continuous float bounded to [0.0, 100.0]",
        "ml_role": "Primary Dynamic Progress Indicator",
    },
    "expenditure_to_original_cost_pct": {
        "description": "Ratio of cumulative expenditure to original sanctioned cost expressed as percentage",
        "source": "Derived financial ratio (cumulative_expenditure / original_cost * 100)",
        "transformation": "Relative capital consumption ratio",
        "ml_role": "Financial Risk Signal (>100% indicates budget overrun)",
    },
    "expenditure_per_progress_pct_cr": {
        "description": "Capital expenditure incurred per 1% of physical progress achieved (INR Cr / %)",
        "source": "Derived efficiency metric (cumulative_expenditure / physical_progress)",
        "transformation": "Capital intensity per unit progress",
        "ml_role": "Burn-Rate Efficiency Signal (Detects abnormal cost escalation per work unit)",
    },
    "remaining_original_cost_cr": {
        "description": "Unspent sanctioned budget balance (original_cost - cumulative_expenditure)",
        "source": "Derived financial metric",
        "transformation": "Budget balance calculation (negative indicates budget overrun)",
        "ml_role": "Financial Buffer Feature (Remaining fiscal headroom)",
    },
    "approval_to_start_days": {
        "description": "Calendar days elapsed between sanction approval and actual physical commencement",
        "source": "Derived timeline duration (start_date - approval_date)",
        "transformation": "Date difference in days",
        "ml_role": "Pre-construction Lag Feature (Land acquisition and tendering bottlenecks)",
    },
    "planned_duration_days": {
        "description": "Total planned execution duration in calendar days from start to original DOC",
        "source": "Derived timeline duration (original_doc - start_date)",
        "transformation": "Date difference in days",
        "ml_role": "Baseline Schedule Horizon (Complexity and scale of planned execution)",
    },
    "elapsed_duration_days": {
        "description": "Calendar days elapsed from physical start date to current reporting month",
        "source": "Derived temporal duration (report_month_date - start_date)",
        "transformation": "Date difference in days as of snapshot observation",
        "ml_role": "Dynamic Lifecycle Stage Feature",
    },
    "remaining_planned_days": {
        "description": "Remaining calendar days until original planned completion date",
        "source": "Derived timeline duration (original_doc - report_month_date)",
        "transformation": "Negative values indicate project has already surpassed original DOC",
        "ml_role": "Schedule Headroom Indicator",
    },
    "elapsed_duration_pct": {
        "description": "Percentage of planned duration already consumed (elapsed_days / planned_days * 100)",
        "source": "Derived schedule ratio",
        "transformation": "Ratio percentage calculation",
        "ml_role": "Schedule Burn Rate (>100% indicates schedule overdue)",
    },
    "progress_per_elapsed_month": {
        "description": "Average monthly physical progress rate achieved since commencement (%/month)",
        "source": "Derived velocity metric (physical_progress / elapsed_months)",
        "transformation": "Physical delivery speed metric",
        "ml_role": "Progress Velocity Indicator (Early warning for stalled progress)",
    },
    "schedule_progress_gap_pct": {
        "description": "Gap between schedule consumption and physical completion (progress_pct - elapsed_duration_pct)",
        "source": "Derived slippage metric",
        "transformation": "Deviation difference (negative signifies progress lagging behind schedule)",
        "ml_role": "Primary Slippage Early Warning Metric",
    },
    "time_overrun_days": {
        "description": "Total schedule slippage in calendar days (revised_doc - original_doc)",
        "source": "Official MoSPI schedule delay calculation",
        "transformation": "Difference in days, 0 if on-time or ahead of schedule",
        "ml_role": "Continuous Regression Target (Days of delay)",
    },
    "time_overrun_months": {
        "description": "Total schedule slippage normalized to calendar months (time_overrun_days / 30.4375)",
        "source": "Official MoSPI schedule delay reporting standard",
        "transformation": "Normalized month calculation",
        "ml_role": "Standard MoSPI Regression Target (Months of delay)",
    },
    "time_overrun_flag": {
        "description": "Binary ground-truth indicator of project schedule overrun (1 = delayed, 0 = on schedule)",
        "source": "Official MoSPI binary delay classification",
        "transformation": "Binary thresholding (1 if delay > threshold, else 0)",
        "ml_role": "Primary Binary Classification Target (Project Delay Classification)",
    }
}


def generate_data_dictionary():
    raw_path = "data/raw/paimana_time_overrun.csv"
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Missing raw dataset: {raw_path}")

    print(f"[DATA DICT] Reading {raw_path}...")
    df = pd.read_csv(raw_path, low_memory=False)
    total_rows, total_cols = df.shape
    print(f"[DATA DICT] Loaded {total_rows:,} rows, {total_cols} columns.")

    md = [
        "# SIH26103 — PAIMANA Time Overrun Dataset: Data Dictionary",
        "",
        f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ",
        "**Dataset**: `data/raw/paimana_time_overrun.csv` (Authoritative Source)  ",
        f"**Scale**: {total_rows:,} records across {total_cols} attributes  ",
        "**Source**: Ministry of Statistics and Programme Implementation (MoSPI) - PAIMANA / OCMS  ",
        "",
        "## 1. Overview",
        "",
        "This data dictionary provides comprehensive, dynamically computed field statistics for the authoritative PAIMANA Time Overrun ML dataset. Every missing-value rate, unique count, and numeric distribution is computed directly from the dataset without hardcoding.",
        "",
        "## 2. Master Field Directory",
        "",
        "| Field Name | Type | Description | Source | Example Value | Missing (%) | Unique | ML Role |",
        "|---|---|---|---|---|---|---|---|"
    ]

    for col in df.columns:
        s = df[col]
        missing_count = int(s.isna().sum())
        missing_rate = round((missing_count / total_rows) * 100, 2)
        unique_count = int(s.nunique(dropna=True))
        
        non_null = s.dropna()
        if len(non_null) > 0:
            val = str(non_null.iloc[0])
            example_val = (val[:28] + "...") if len(val) > 30 else val
        else:
            example_val = "N/A"

        # Missing indicator columns auto-doc
        if col.endswith("_missing"):
            base_col = col.replace("_missing", "")
            info = {
                "description": f"Binary missingness indicator flag for '{base_col}' (1 if missing, 0 if present)",
                "source": "Derived data engineering quality feature",
                "ml_role": "Missingness Indicator Feature (Captures reporting incompleteness pattern)"
            }
        else:
            info = COLUMN_METADATA.get(col, {
                "description": "Infrastructure monitoring metric extracted from PAIMANA",
                "source": "MoSPI PAIMANA System",
                "ml_role": "Predictive Feature / Target"
            })

        md.append(
            f"| `{col}` | `{s.dtype}` | {info['description']} | {info['source']} | `{example_val}` | {missing_rate}% | {unique_count:,} | {info['ml_role']} |"
        )

    md.extend([
        "",
        "## 3. Statistical Distribution of Numerical Features",
        "",
        "| Metric | Mean | Std Dev | Min | 25% | Median | 75% | Max |",
        "|---|---|---|---|---|---|---|---|"
    ])

    num_cols = [c for c in df.columns if not c.endswith("_missing") and c != "project_code" and pd.api.types.is_numeric_dtype(df[c])]
    for nc in num_cols:
        s = df[nc].dropna()
        if len(s) > 0:
            md.append(
                f"| `{nc}` | {round(s.mean(), 2):,} | {round(s.std(), 2):,} | {round(s.min(), 2):,} | {round(s.quantile(0.25), 2):,} | {round(s.median(), 2):,} | {round(s.quantile(0.75), 2):,} | {round(s.max(), 2):,} |"
            )

    md.extend([
        "",
        "## 4. CUF vs Derived / Engineered Classification",
        "",
        "### 4.1 CUF / Baseline Project Attributes (10 Fields)",
        "- `project_code`: Unique identifier",
        "- `report_year`, `report_month_num`: Temporal snapshot attributes",
        "- `agency_frequency`, `state_frequency`: Spatial & Organizational identifiers",
        "- `original_cost_cr`: Sanctioned budget",
        "- `cumulative_expenditure_cr`: Incurred spend",
        "- `physical_progress_pct`: Physical completion",
        "- `approval_to_start_days`, `planned_duration_days`: Initial DPR schedule attributes",
        "",
        "### 4.2 Derived & Engineered Features (8 Fields)",
        "- `expenditure_to_original_cost_pct`: Capital consumption ratio",
        "- `expenditure_per_progress_pct_cr`: Spend per percent of progress",
        "- `remaining_original_cost_cr`: Remaining budget headroom",
        "- `elapsed_duration_days`: Consumed project duration",
        "- `remaining_planned_days`: Remaining planned timeline",
        "- `elapsed_duration_pct`: Schedule burn-rate percentage",
        "- `progress_per_elapsed_month`: Monthly delivery speed",
        "- `schedule_progress_gap_pct`: Physical vs Schedule gap",
        "",
        "### 4.3 Missingness Indicators (17 Fields)",
        "- `report_year_missing` through `schedule_progress_gap_pct_missing`",
        "",
        "### 4.4 Target Variables (3 Fields)",
        "- `time_overrun_days`: Delay in days",
        "- `time_overrun_months`: Delay in months",
        "- `time_overrun_flag`: Delay binary indicator"
    ])

    report_path = "reports/data_dictionary.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md) + "\n")

    print(f"[DATA DICT] Successfully wrote {report_path}.")


if __name__ == "__main__":
    generate_data_dictionary()
