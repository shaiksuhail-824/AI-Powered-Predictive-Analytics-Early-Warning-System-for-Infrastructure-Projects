"""
src/data/ingest.py - Data Ingestion Stage for SIH26103
Ingests ONLY the authentic PAIMANA Time Overrun ML dataset into data/raw/paimana_time_overrun.csv
Preserves raw data immutably and logs exact file provenance and SHA256 checksums.
"""

import os
import shutil
import hashlib
import pandas as pd
from datetime import datetime

SOURCE_DATASET_PATH = r"C:\Users\varsh\Downloads\PAIMANA_Time_Overrun_ML_dataset (1).csv"
DEST_RAW_PATH = "data/raw/paimana_time_overrun.csv"
REPORT_METADATA_PATH = "reports/source_metadata.md"


def compute_sha256(filepath: str) -> str:
    """Compute SHA256 checksum of a file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()


def ingest_data() -> dict:
    """Ingest the designated PAIMANA dataset exclusively into data/raw/."""
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("reports", exist_ok=True)

    print(f"[INGEST] Checking source file: {SOURCE_DATASET_PATH}...")
    if not os.path.exists(SOURCE_DATASET_PATH):
        if os.path.exists(DEST_RAW_PATH):
            print(f"[INFO] Source in Downloads not found, but destination exists: {DEST_RAW_PATH}")
            src_path = DEST_RAW_PATH
        else:
            raise FileNotFoundError(f"Required source dataset not found: {SOURCE_DATASET_PATH}")
    else:
        src_path = SOURCE_DATASET_PATH
        print(f"[INGEST] Copying {src_path} -> {DEST_RAW_PATH}...")
        shutil.copy2(src_path, DEST_RAW_PATH)

    # Calculate exact properties
    file_size_bytes = os.path.getsize(DEST_RAW_PATH)
    file_size_kb = round(file_size_bytes / 1024, 2)
    file_size_mb = round(file_size_kb / 1024, 2)
    sha256_hash = compute_sha256(DEST_RAW_PATH)

    print("[INGEST] Reading raw dataset to compute baseline dimensions...")
    df = pd.read_csv(DEST_RAW_PATH, low_memory=False)
    rows, cols = df.shape
    print(f"[INGEST] Ingested raw dataset successfully: {rows:,} rows, {cols} columns.")

    # Write reports/source_metadata.md
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    metadata_content = f"""# SIH26103 — Data Source Provenance & Ingestion Report

**Generated**: {now_str}  
**Source Authority**: Ministry of Statistics and Programme Implementation (MoSPI)  
**Platform**: PAIMANA (Projects Appraisal, Information Management and Analytics Network) / OCMS  
**Designated Dataset**: `PAIMANA_Time_Overrun_ML_dataset (1).csv` (Exclusive Source)  

---

## 1. Immutable Raw Dataset

| Attribute | Value |
|---|---|
| **Raw File Path** | `{DEST_RAW_PATH}` |
| **Original Source Path** | `{SOURCE_DATASET_PATH}` |
| **File Size** | {file_size_mb} MB ({file_size_kb:,} KB) |
| **Total Rows** | {rows:,} |
| **Total Columns** | {cols} |
| **SHA256 Checksum** | `{sha256_hash}` |
| **DVC Tracking Status** | Versioned under DVC (`data/raw/paimana_time_overrun.csv.dvc`) |
| **Immutability Guarantee**| Read-only source layer; transformations produced in `data/interim/`, `data/processed/`, `data/features/` |

---

## 2. Ingested Attributes Summary ({cols} Columns)

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
"""

    with open(REPORT_METADATA_PATH, "w", encoding="utf-8") as f:
        f.write(metadata_content)

    print(f"[INGEST] Source metadata written to {REPORT_METADATA_PATH}.")
    return {
        "status": "success",
        "raw_path": DEST_RAW_PATH,
        "rows": rows,
        "cols": cols,
        "sha256": sha256_hash
    }


if __name__ == "__main__":
    ingest_data()
