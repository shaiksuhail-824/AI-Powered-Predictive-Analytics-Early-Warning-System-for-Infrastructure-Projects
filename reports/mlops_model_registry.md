# SIH26103 — MLOps, Tracking & Model Registry Governance Report

**Document ID**: `MOSPI-PAIMANA-ML-006`  
**Problem Statement**: SIH26103 — AI-Powered Predictive Analytics and Early Warning System for Infrastructure Projects (PAIMANA / MoSPI)  
**System Version**: `v1.0.0`  
**Data Status**: `SYNTHETIC / DEMONSTRATION`  

---

> [!IMPORTANT]
> **Data Status Notice**: The models registered below are trained on **SYNTHETIC / DEMO DATA**. Their metadata tags permanently record `DATA_STATUS = SYNTHETIC / DEMONSTRATION` to prevent premature operational deployment.

---

## 1. DVC vs MLflow Architectural Division of Responsibilities

The pipeline enforces strict separation of concerns between data versioning and model lifecycle tracking:

```text
┌────────────────────────────────────────────────────────┐
│                   DVC PIPELINE LAYER                   │
│  - Raw Data Immutability (data/raw/)                  │
│  - Dataset Versioning & Content-Addressable Hashes     │
│  - Pipeline Stage Reproducibility (dvc.yaml, dvc.lock) │
│  - Preprocessed & Feature Datasets (data/features/)    │
└───────────────────────────┬────────────────────────────┘
                            │ (Feature Datasets)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  MLFLOW TRACKING LAYER                 │
│  - Experiment Runs (paimana_infrastructure_risk)       │
│  - Hyperparameters & Training Configurations           │
│  - Precision, Recall, F1, ROC-AUC, PR-AUC Metrics       │
│  - Model Artifacts, Preprocessors, Scalers, Metrics     │
└───────────────────────────┬────────────────────────────┘
                            │ (Winning Models)
                            ▼
┌────────────────────────────────────────────────────────┐
│               MLFLOW MODEL REGISTRY LAYER              │
│  - Versioned Production Model Registry                 │
│  - Governance Tags (DATA_STATUS=SYNTHETIC/DEMO)        │
│  - Lifecycle Stages: DEVELOPMENT → VALIDATION → PROD   │
│  - Fast Model Loading for FastAPI Serving Layer        │
└────────────────────────────────────────────────────────┘
```

---

## 2. MLflow Experiment Tracking Architecture

* **Tracking Backend**: Local SQLite database (`sqlite:///mlflow.db`) ensuring complete portability without external network dependencies.
* **Experiment Name**: `paimana_infrastructure_risk`
* **Tracked Entities per Run**:
  - **Parameters**: `model_type`, `feature_type`, `target`, `features_count`, `train_samples`, `val_samples`, `test_samples`, `random_seed`, `data_status`.
  - **Metrics**: Train/Validation/Test `precision`, `recall`, `f1`, `roc_auc`, `pr_auc`, `brier_score`.
  - **Artifacts**: Serialized pipeline object (`.pkl`), input feature lists, confusion matrix plots, ROC/PR curves, SHAP summary charts.

---

## 3. Registered Production Models

The winning candidates were programmatically registered and promoted to the `PRODUCTION` stage via `src/mlops/register_model.py`:

| Model Name | Version | Architecture | Target | Lifecycle Stage | Data Status Tag | Stored Artifact Path |
|---|:---:|---|---|:---:|:---:|---|
| **`Schedule_Delay_Predictor`** | 4 | Logistic Regression | `future_schedule_delay` | `PRODUCTION` | `SYNTHETIC / DEMONSTRATION` | `models/schedule_delay/production_model.pkl` |
| **`Cost_Overrun_Predictor`** | 4 | Random Forest | `future_cost_overrun` | `PRODUCTION` | `SYNTHETIC / DEMONSTRATION` | `models/cost_overrun/production_model.pkl` |
| **`Project_Anomaly_Sentinel`** | 3 | Isolation Forest | Multi-attribute Anomaly | `PRODUCTION` | `SYNTHETIC / DEMONSTRATION` | `models/anomaly_detector/production_anomaly_detector.pkl` |

---

## 4. Model Governance & Production Promotion Policy

1. **No Automatic Promotion on Training Success**: Models are only promoted if they satisfy minimum validation thresholds ($F1 \ge 0.85$ and $\text{Recall} \ge 0.90$ on positive high-risk class).
2. **Deterministic Reproducibility**: All models are initialized with fixed seeds (`random_seed=42`) and configurable YAML parameters (`configs/model_params.yaml`).
3. **Data Team Transition Readiness**: When official MoSPI historical data arrives, running `dvc repro` will automatically retrain all models, log new versions to MLflow, and update the registry without any code changes.
