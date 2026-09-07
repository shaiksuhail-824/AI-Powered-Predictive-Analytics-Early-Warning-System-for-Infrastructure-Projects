# SIH26103 — AI-Powered Infrastructure Project Monitoring

## Problem Statement

**SIH26103 — Use case on web-based integrated project-monitoring platform**

### Organization

Ministry of Statistics and Programme Implementation (MoSPI)

### Department

Data Informatics & Innovation

### Broader Theme

AI for Infrastructure Monitoring

---

# 1. Project Objective

The objective of this project is to develop an AI-powered predictive analytics and early-warning system for infrastructure project monitoring.

The system will use historical and continuously updated project-monitoring information from PAIMANA/OCMS to identify projects that may be at risk of:

- Cost escalation
- Schedule/time overruns
- Milestone delays
- Implementation risks

The solution aims to transform infrastructure monitoring from:

**Descriptive Monitoring → Predictive Monitoring → Prescriptive Decision Support**

---

# 2. Planned System

The complete solution will eventually contain:

1. Data Engineering Pipeline
2. Exploratory Data Analysis
3. Data Validation
4. Data Preprocessing
5. Feature Engineering
6. Cost Overrun Prediction
7. Time Overrun Prediction
8. Project Risk Scoring
9. Early Warning System
10. Explainable AI
11. Benchmarking and Comparative Analytics
12. AI-powered Dashboard
13. LLM-based Project Intelligence Assistant
14. MLOps Pipeline
15. API Layer
16. Cloud Deployment
17. Monitoring and Observability

---

# 3. Current Development Phase

> **IMPORTANT**: The current development phase focuses ONLY on the data foundation.

### Current scope

```text
Source Data
    ↓
Raw Dataset
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

Machine learning, FastAPI, AWS deployment, LLM/RAG, and frontend integration will be implemented in later phases.

---

# 4. Planned Architecture & MLOps Strategy

The project architecture and MLOps strategy combine Git for code versioning, DVC for dataset and data-pipeline versioning, and MLflow for experiment tracking and model registry.

### Technology Stack

- **Git** — source-code version control
- **DVC** — dataset and data-pipeline versioning
- **MLflow** — experiment tracking and ML artifact management
- **Python** — data and ML implementation
- **Pandas / NumPy** — data processing
- **Matplotlib / Seaborn** — visualization
- **Scikit-learn** — baseline/statistical/ML models
- **Docker** — later-stage packaging
- **FastAPI** — later-stage inference API
- **AWS** — later-stage deployment and infrastructure

### DVC Strategy

DVC is used to track raw, interim, processed, and feature datasets without bloating the Git repository. Pipeline stages (`ingest`, `validate`, `eda`, `preprocess`, `feature_engineering`) are managed reproducibly via `dvc.yaml` and `params.yaml`, with execution locks tracked in `dvc.lock`.

### MLflow Strategy

MLflow is reserved for the future ML phase to track experiments, model parameters, evaluation metrics, and artifacts, providing a clean separation between data versioning (DVC) and model management (MLflow).

---

# 5. Data Lifecycle

```text
Raw Data
   ↓
DVC
   ↓
Validation
   ↓
EDA
   ↓
Preprocessing
   ↓
Feature Engineering
   ↓
ML-ready Dataset
   ↓
ML Training
   ↓
MLflow
   ↓
Model Registry
   ↓
API
   ↓
AWS
```

---

# 6. Data Directory

```text
data/
├── raw/
├── external/
├── interim/
├── processed/
└── features/
```

### raw/

Original extracted data. Never overwrite the original dataset.

### external/

External datasets or supplementary official sources.

### interim/

Validated and intermediate datasets.

### processed/

Cleaned and transformed analytical datasets.

### features/

Final ML-ready features and target datasets.

All large datasets must be managed through DVC.

---

# 7. DVC Pipeline

The initial DVC pipeline will contain:

```text
ingest
   ↓
validate
   ↓
eda
   ↓
preprocess
   ↓
feature_engineering
```

The pipeline must be reproducible using:

```bash
dvc repro
```

Parameters will be maintained in:

```text
params.yaml
```

Pipeline state will be recorded in:

```text
dvc.lock
```

---

# 8. Team Responsibilities

The data team is responsible for producing:

- Raw dataset
- Data dictionary
- Data-quality report
- EDA report
- Cleaned dataset
- Processed dataset
- Feature dataset
- Feature dictionary
- Target-definition proposal
- DVC pipeline
- Reproducibility documentation

The final output of the data phase is:

> A versioned, validated, reproducible, ML-ready infrastructure-project dataset.

---

# 9. Important ML Principle & Future ML Pipeline

The project must avoid data leakage. For early-warning prediction:

```text
Information available at time T
              ↓
         ML prediction
              ↓
        Future outcome
```

Information that would only become available after the event must not be used as a predictive feature.

### Planned ML Problems

- **Cost Overrun**: Predict the probability and/or magnitude of future cost escalation.
- **Time Overrun**: Predict whether a project will experience a significant delay and estimate expected delay where supported by the data.
- **Risk Score**: Combine relevant predictive signals into a project-level risk score.
- **Early Warning**: Identify deteriorating project conditions before a major adverse outcome occurs.

---

# 10. CUF Analysis

The PS requires assessment of the predictive value of existing CUF fields.

Therefore, the project will eventually compare:

```text
Model A
CUF / existing project fields
```

against:

```text
Model B
CUF fields
+
derived features
+
historical features
+
temporal features
```

The comparison will be evidence-based using appropriate evaluation metrics.

---

# 11. Future API Layer & AWS Deployment

### Future API Layer

In subsequent phases, a FastAPI backend will expose inference endpoints for cost overrun probability, schedule delay estimation, project risk scores, and early warning alerts to serve the executive dashboard.

### Future AWS Deployment

Cloud infrastructure (storage, compute, containerization, and monitoring) will be deployed on AWS in later phases once the ML models and API layer pass evaluation and testing.

---

# 12. Reproducibility Principle

A result should be traceable through:

```text
Git Commit
    +
DVC Dataset Version
    +
Pipeline Parameters
    +
Environment
    ↓
Reproducible Dataset
    ↓
MLflow Experiment
```

No important result should depend on an undocumented manual operation.

---

# 13. Development Phases

### Phase 1 — Data Foundation (Current)

- Source identification
- Dataset extraction
- Raw dataset creation
- DVC initialization
- Data validation

### Phase 2 — Data Analysis (Current)

- Data dictionary
- Data-quality analysis
- EDA
- Data cleaning

### Phase 3 — Feature Engineering (Current)

- Temporal features
- Financial features
- Progress features
- Schedule features
- Project-level aggregates

### Phase 4 — Machine Learning (Future)

- Statistical baselines
- ML models
- Model evaluation
- Explainability

### Phase 5 — MLflow (Future)

- Experiment tracking
- Metrics
- Model artifacts
- Model registry

### Phase 6 — MLOps (Future)

- Testing
- Docker
- CI/CD
- Model versioning

### Phase 7 — Backend (Future)

- FastAPI
- Prediction APIs
- Risk APIs

### Phase 8 — Frontend (Future)

- Executive dashboard
- Project details
- Risk dashboard
- Early-warning center

### Phase 9 — AWS (Future)

- Storage
- Compute
- Deployment
- Monitoring
- Security

---

# 14. Engineering Principle

Build the simplest architecture that can demonstrate the SIH problem convincingly.

Do not add technologies merely to increase the technology list.

Every component must have a clear purpose in solving the infrastructure-monitoring problem.

---

# 15. Documentation

- [Data Team Guide](docs/DATA_TEAM_README.md)
- [DVC Data Pipeline](docs/DATA_PIPELINE.md)
