# SIH26103 — DVC Data Pipeline

## Purpose

This document defines how the data pipeline transforms PAIMANA project-monitoring data into an ML-ready dataset.

---

# Pipeline

```text
Raw Data
   │
   ▼
┌─────────────┐
│   Ingest    │
└──────┬──────┘
       ▼
┌─────────────┐
│  Validate   │
└──────┬──────┘
       ▼
┌─────────────┐
│     EDA     │
└──────┬──────┘
       ▼
┌─────────────┐
│ Preprocess  │
└──────┬──────┘
       ▼
┌────────────────────┐
│ Feature Engineering│
└─────────┬──────────┘
          ▼
   ML-ready Dataset
```

---

# Stage 1 — Ingestion

Input:

```text
Official PAIMANA/source files
```

Output:

```text
data/raw/
```

Responsibilities:

- Preserve source data.
- Record source metadata.
- Avoid modifying original values.
- Assign dataset version through DVC.

---

# Stage 2 — Validation

Input:

```text
data/raw/
```

Output:

```text
data/interim/validated/
```

Validation includes:

- Schema validation
- Data type validation
- Null analysis
- Duplicate detection
- Date validation
- Numeric validation
- Category consistency
- Range checks

---

# Stage 3 — EDA

Input:

```text
validated dataset
```

Output:

```text
reports/eda_report.md
reports/figures/
```

EDA is primarily an analytical stage.

The final report should be reproducible from the dataset and declared parameters.

---

# Stage 4 — Preprocessing

Input:

```text
validated dataset
```

Output:

```text
data/processed/
```

Potential operations:

- Missing-value handling
- Date parsing
- Numeric conversion
- Category normalization
- Duplicate resolution
- Invalid-record handling

Every transformation must be documented.

---

# Stage 5 — Feature Engineering

Input:

```text
data/processed/
```

Output:

```text
data/features/
```

Potential feature groups:

### Financial

- Cost growth
- Expenditure ratio
- Expenditure deviation
- Cost-to-progress relationships

### Schedule

- Planned duration
- Elapsed duration
- Remaining duration
- Schedule deviation

### Progress

- Physical progress
- Progress velocity
- Progress deviation
- Milestone completion rate

### Historical

- Sector-level historical delay rate
- Agency-level historical performance
- Similar-project statistics

Historical features must be calculated without using future information.

---

# DVC Commands

Initialize:

```bash
dvc init
```

Track dataset:

```bash
dvc add data/raw/paimana_projects.csv
```

Commit metadata:

```bash
git add data/raw/paimana_projects.csv.dvc .gitignore
git commit -m "Track PAIMANA raw dataset"
```

Configure remote according to the team's approved storage configuration.

Push:

```bash
dvc push
```

Reproduce:

```bash
dvc repro
```

Check pipeline:

```bash
dvc dag
```

Inspect status:

```bash
dvc status
```

---

# Parameterization

Pipeline configuration belongs in:

```text
params.yaml
```

Examples of parameters:

```yaml
preprocessing:
  missing_threshold: 0.5

feature_engineering:
  progress_window_months: 3

targets:
  delay_threshold_months: 6
```

These are examples only.

Actual values must be decided from the data analysis and documented methodology.

---

# Reproducibility

The intended lineage is:

```text
Git commit
    +
DVC dataset version
    +
params.yaml
    +
code
    ↓
dvc repro
    ↓
same pipeline outputs
```

---

# MLflow Boundary

DVC manages:

```text
Datasets
Pipeline outputs
Data versions
```

MLflow manages later:

```text
Experiments
Parameters
Metrics
Models
ML evaluation plots
ML artifacts
```

This separation must be maintained.
