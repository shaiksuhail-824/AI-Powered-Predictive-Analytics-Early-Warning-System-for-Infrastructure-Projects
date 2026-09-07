# SIH26103 — Data Analysis Team Guide

## Mission

The Data Analysis Team is responsible for transforming raw PAIMANA/OCMS project-monitoring information into a clean, validated, documented, reproducible, ML-ready dataset.

The team does NOT own model training, FastAPI, frontend, AWS deployment, or LLM development during this phase.

---

# 1. Data Team Workflow

```text
Source Identification
       ↓
Data Extraction
       ↓
Raw Dataset
       ↓
DVC Tracking
       ↓
Data Validation
       ↓
EDA
       ↓
Preprocessing
       ↓
Feature Engineering
       ↓
ML-ready Dataset
```

---

# 2. Responsibilities

## Member A — Data Acquisition

Responsibilities:

- Identify official PAIMANA sources.
- Collect available project records/reports.
- Extract structured tables from official reports where required.
- Preserve original source files.
- Record source URL/report/date information.
- Never modify raw source data.

Deliverables:

```text
data/raw/
reports/source_metadata.md
```

---

## Member B — Data Validation & Quality

Responsibilities:

- Inspect schema.
- Validate data types.
- Detect duplicate records.
- Detect missing values.
- Detect invalid values.
- Validate dates.
- Validate numeric fields.
- Identify inconsistent categorical values.
- Produce data-quality report.

Deliverables:

```text
src/data/validate.py
reports/data_quality.md
data/interim/
```

---

## Member C — EDA

Responsibilities:

- Analyze distributions.
- Analyze missingness.
- Analyze project sectors.
- Analyze ministries.
- Analyze project costs.
- Analyze physical progress.
- Analyze expenditure.
- Analyze completion dates.
- Analyze cost escalation.
- Analyze time delays.
- Identify relationships useful for predictive modelling.

EDA must answer questions relevant to SIH26103.

Deliverables:

```text
notebooks/02_eda.ipynb
reports/eda_report.md
reports/figures/
```

---

## Member D — Preprocessing

Responsibilities:

- Handle missing values according to documented rules.
- Normalize categorical values.
- Parse dates.
- Convert numeric fields.
- Handle invalid records.
- Remove or resolve duplicates.
- Prepare clean analytical datasets.

Deliverables:

```text
src/data/preprocess.py
data/processed/
```

---

## Member E — Feature Engineering

Responsibilities:

- Design project-level features.
- Design temporal features where monthly data is available.
- Create progress-related features.
- Create financial features.
- Create schedule-related features.
- Document every engineered feature.
- Avoid target leakage.

Deliverables:

```text
src/data/feature_engineering.py
data/features/
reports/feature_dictionary.md
```

---

# 3. DVC Rules

All important datasets must be tracked using DVC.

Example:

```bash
dvc add data/raw/paimana_projects.csv
git add data/raw/paimana_projects.csv.dvc .gitignore
git commit -m "Track PAIMANA raw dataset"
```

After the remote is configured:

```bash
dvc push
```

To reproduce:

```bash
dvc pull
dvc repro
```

Never commit large datasets directly to Git.

---

# 4. Pipeline Rules

The pipeline should eventually be represented as:

```text
ingest
validate
eda
preprocess
feature_engineering
```

Each stage should:

- Have a clear input.
- Have a clear output.
- Be executable independently where practical.
- Avoid hidden manual operations.
- Be reproducible.
- Have documented parameters.

---

# 5. EDA Rules

Do not create graphs merely because they look attractive.

Every graph should answer a project question.

Good examples:

- Which sectors have the largest cost escalation?
- Which sectors have the highest delay rate?
- Does physical progress correlate with expenditure?
- How does project size relate to cost escalation?
- Are there patterns in schedule slippage?
- Which fields contain significant missingness?
- Which variables appear useful for future prediction?

---

# 6. Data Leakage Rules

Before adding any feature, ask:

> "Would this value have been known at the prediction time?"

If the answer is no, the feature must not be used for early-warning prediction.

Example:

```text
Prediction date: April 2024

Allowed:
- progress known in April 2024
- expenditure known in April 2024
- historical information
- project attributes known by April 2024

Not allowed:
- final revised cost determined in 2026
- final completion date determined after the prediction date
- future project outcome
```

---

# 7. Temporal Dataset Principle

Where monthly project data is available, prefer a temporal representation:

```text
project_id
report_month
physical_progress
expenditure
cost
completion_date
milestone_status
...
```

This can later support early-warning modelling.

The team must not invent historical observations when they are unavailable.

---

# 8. Data Dictionary

Every important field must be documented.

Minimum fields:

| Field | Meaning | Type | Source | Missing | Transformation | ML Role |
|---|---|---|---|---|---|---|

---

# 9. Feature Dictionary

Every engineered feature must be documented.

Example:

| Feature | Definition | Source Fields | Reason |
|---|---|---|---|
| progress_deviation | Difference between expected and observed progress | progress + timeline | Detect project slippage |
| cost_growth_pct | Cost increase relative to original cost | original/revised cost | Financial risk |
| elapsed_duration_ratio | Elapsed duration / planned duration | dates | Schedule risk |

Definitions must be based on the actual available dataset.

---

# 10. Pull Request Checklist

Before opening a PR:

```text
[ ] Dataset changes tracked through DVC
[ ] No large dataset committed to Git
[ ] Data dictionary updated
[ ] Missing values analyzed
[ ] No undocumented manual transformations
[ ] Tests pass
[ ] DVC pipeline runs
[ ] No target leakage introduced
[ ] README/documentation updated
```

---

# 11. Definition of Done

The data phase is complete only when:

- Raw data is preserved.
- Dataset versions are reproducible.
- Data quality is documented.
- EDA is documented.
- Preprocessing is reproducible.
- Features are documented.
- Target definitions are proposed and justified.
- ML-ready datasets are generated.
- DVC pipeline reproduces the outputs.
- Another team member can reproduce the dataset without asking the original author what they did.
