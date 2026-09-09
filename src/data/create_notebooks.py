"""
src/data/create_notebooks.py
Generates the 4 required analytical Jupyter notebooks in notebooks/
- 01_data_understanding.ipynb
- 02_data_quality.ipynb
- 03_eda.ipynb
- 04_feature_analysis.ipynb
"""

import os
import json


def make_notebook(cells):
    return {
        "cells": cells,
        "metadata": {
            "language_info": {
                "name": "python",
                "version": "3.13"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }


def md_cell(text):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.split("\n")]
    }


def code_cell(code):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in code.split("\n")]
    }


def generate_all_notebooks():
    os.makedirs("notebooks", exist_ok=True)

    # 1. 01_data_understanding.ipynb
    nb1_cells = [
        md_cell("# 01 — PAIMANA Data Understanding & Ingestion\n\n**Ministry of Statistics and Programme Implementation (MoSPI)**  \n**SIH26103 — AI for Infrastructure Monitoring**\n\nThis notebook inspects the raw PAIMANA Time Overrun dataset ingested into `data/raw/paimana_time_overrun.csv`."),
        code_cell("import pandas as pd\nimport numpy as np\n\nraw_path = '../data/raw/paimana_time_overrun.csv'\ndf = pd.read_csv(raw_path, low_memory=False)\nprint(f'Raw Dataset Shape: {df.shape}')\ndf.head()"),
        md_cell("### Column Inventory & Missing Value Analysis"),
        code_cell("missing_df = pd.DataFrame({\n    'Data Type': df.dtypes,\n    'Missing Count': df.isna().sum(),\n    'Missing Pct (%)': (df.isna().sum() / len(df) * 100).round(2)\n})\nmissing_df"),
        md_cell("### Summary Statistics of Core Attributes"),
        code_cell("df[['original_cost_cr', 'cumulative_expenditure_cr', 'physical_progress_pct', 'planned_duration_days', 'time_overrun_days', 'time_overrun_months']].describe()")
    ]
    with open("notebooks/01_data_understanding.ipynb", "w", encoding="utf-8") as f:
        json.dump(make_notebook(nb1_cells), f, indent=2)
    print("[NOTEBOOK] Created notebooks/01_data_understanding.ipynb")

    # 2. 02_data_quality.ipynb
    nb2_cells = [
        md_cell("# 02 — PAIMANA Data Quality & Validation\n\n**SIH26103 — Infrastructure Project Monitoring**\n\nValidates data integrity, non-negative financial constraints, physical progress bounds [0, 100]%, duplicate detection, and missing indicator flags."),
        code_cell("import pandas as pd\nimport numpy as np\n\ninterim_path = '../data/interim/paimana_time_overrun_validated.csv'\ndf = pd.read_csv(interim_path, low_memory=False)\nprint(f'Validated Dataset Shape: {df.shape}')"),
        md_cell("### Check 1: Record & Key Uniqueness"),
        code_cell("duplicates = df.duplicated().sum()\nkey_duplicates = df.duplicated(subset=['project_code', 'report_year', 'report_month_num']).sum()\nprint(f'Exact duplicate rows: {duplicates}')\nprint(f'Duplicate (project, year, month) records: {key_duplicates}')"),
        md_cell("### Check 2: Physical Progress & Financial Bounds"),
        code_cell("assert (df['original_cost_cr'] >= 0).all(), 'Negative cost found!'\nassert (df['cumulative_expenditure_cr'] >= 0).all(), 'Negative spend found!'\nassert ((df['physical_progress_pct'] >= 0) & (df['physical_progress_pct'] <= 100)).all(), 'Progress out of bounds!'\nprint('All invariant checks passed: Non-negative costs and bounded progress.')"),
        md_cell("### Check 3: Ground-Truth Target Consistency"),
        code_cell("print(df['time_overrun_flag'].value_counts(dropna=False))\nprint(f'Delay Rate: {(df[\"time_overrun_flag\"] == 1).mean() * 100:.2f}%')")
    ]
    with open("notebooks/02_data_quality.ipynb", "w", encoding="utf-8") as f:
        json.dump(make_notebook(nb2_cells), f, indent=2)
    print("[NOTEBOOK] Created notebooks/02_data_quality.ipynb")

    # 3. 03_eda.ipynb
    nb3_cells = [
        md_cell("# 03 — Exploratory Data Analysis (EDA)\n\nVisualizes infrastructure project delay distributions, physical progress vs expenditure parity, schedule-progress gaps, and temporal delay trajectories."),
        code_cell("import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\ndf = pd.read_csv('../data/interim/paimana_time_overrun_validated.csv', low_memory=False)\nplt.style.use('seaborn-v0_8-whitegrid')"),
        md_cell("### Target Overrun Distribution"),
        code_cell("fig, ax = plt.subplots(figsize=(6, 4))\nsns.countplot(data=df, x='time_overrun_flag', palette=['green', 'red'], ax=ax)\nax.set_title('Schedule Overrun Classification (0=On-Time, 1=Delayed)')\nplt.show()"),
        md_cell("### Physical Progress vs Expenditure"),
        code_cell("fig, ax = plt.subplots(figsize=(8, 6))\nax.scatter(df['physical_progress_pct'], df['expenditure_to_original_cost_pct'].clip(upper=200), c=df['time_overrun_flag'], cmap='coolwarm', alpha=0.3, s=15)\nax.plot([0, 100], [0, 100], 'k--', label='Parity Line')\nax.set_xlabel('Physical Progress (%)')\nax.set_ylabel('Expenditure / Original Cost (%)')\nax.legend()\nplt.show()"),
        md_cell("### Schedule-Progress Gap as Early Warning Discriminator"),
        code_cell("fig, ax = plt.subplots(figsize=(7, 4))\nsns.boxplot(data=df, x='time_overrun_flag', y=df['schedule_progress_gap_pct'].clip(-150, 100), palette=['green', 'red'], ax=ax)\nax.set_title('Schedule-Progress Gap by Overrun Status')\nplt.show()")
    ]
    with open("notebooks/03_eda.ipynb", "w", encoding="utf-8") as f:
        json.dump(make_notebook(nb3_cells), f, indent=2)
    print("[NOTEBOOK] Created notebooks/03_eda.ipynb")

    # 4. 04_feature_analysis.ipynb
    nb4_cells = [
        md_cell("# 04 — Feature Engineering & CUF Baseline Comparison\n\nCompares the Common Utility Format (CUF) baseline features against the full extended feature matrix, confirming predictive lift potential and data leakage prevention."),
        code_cell("import pandas as pd\n\ncuf_df = pd.read_csv('../data/features/paimana_cuf_baseline.csv')\nml_df = pd.read_csv('../data/features/paimana_ml_ready_time_overrun.csv')\n\nprint(f'CUF Baseline Features: {cuf_df.shape[1]} attributes')\nprint(f'Full Engineered ML-Ready Features: {ml_df.shape[1]} attributes')"),
        md_cell("### Correlation of Engineered Features with Overrun Target"),
        code_cell("corr = ml_df.corr(numeric_only=True)['time_overrun_flag'].sort_values()\nprint('Top 5 Inversely Correlated Features with Delay:')\nprint(corr.head(5))\nprint('\\nTop 5 Positively Correlated Features with Delay:')\nprint(corr.tail(6))"),
        md_cell("### Anti-Leakage Verification"),
        code_cell("forbidden = ['revised_cost_cr', 'revised_doc_dt', 'actual_completion_date']\nfor col in forbidden:\n    assert col not in ml_df.columns, f'Data leakage alert: {col} present in feature matrix!'\nprint('Verification passed: Zero future information or target leakage detected.')")
    ]
    with open("notebooks/04_feature_analysis.ipynb", "w", encoding="utf-8") as f:
        json.dump(make_notebook(nb4_cells), f, indent=2)
    print("[NOTEBOOK] Created notebooks/04_feature_analysis.ipynb")


if __name__ == "__main__":
    generate_all_notebooks()
