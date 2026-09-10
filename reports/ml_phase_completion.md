# Phase 1 ML + MLOps Production Pipeline Completion Report
**AI-Powered Predictive Analytics & Early Warning System for Infrastructure Projects (PAIMANA / MoSPI)**  
**Problem Statement**: SIH 26103  
**Data Status**: `SYNTHETIC / DEMONSTRATION` (All synthetic attributes strictly labeled; no fabricated real PAIMANA results)  
**Execution Timestamp**: September 10, 2026  
**Pipeline State**: Fully Reproducible via DVC (`dvc repro` up to date, 42/42 tests passing)

---

## 1. Executive Summary & Verification Matrix

The Machine Learning and MLOps production pipeline for SIH 26103 has been designed, implemented, tested, and reproduced end-to-end. The system strictly complies with all engineering, anti-leakage, and temporal validation requirements:

| Acceptance Criterion | Verification Status | Artifact / Evidence |
| :--- | :--- | :--- |
| **Python Environment** | ✅ Fully Functional | Python 3.13.5 (`.venv`), scikit-learn 1.9.0, xgboost 3.4.1, shap 0.52.0, mlflow 3.16.0 |
| **Direct Module Execution** | ✅ Verified | Direct execution of `train.py`, `evaluate.py`, `model_selection.py`, `predict.py`, etc. passes |
| **DVC Training & Pipeline** | ✅ Fully Reproducible | `dvc repro` reproduces entire DAG (`train` -> `model_selection` -> `anomaly_sentinel` -> `evaluate` -> `register`); `dvc status` reports `Data and pipelines are up to date.` |
| **Schedule Delay Candidate Models** | ✅ Trained & Evaluated | Logistic Regression, Random Forest, XGBoost evaluated on CUF and Enhanced datasets |
| **Cost Overrun Candidate Models** | ✅ Trained & Evaluated | Logistic Regression, Random Forest, XGBoost evaluated on CUF and Enhanced datasets |
| **Model Selection Protocol** | ✅ Deterministic | Objective validation metrics used: Schedule Delay (`schedule_delay_cuf_logistic_regression`), Cost Overrun (`cost_overrun_enhanced_random_forest`) |
| **Temporal Validation & Anti-Leakage** | ✅ Chronological Split | Expanding window: Train (2023-01 to 2025-06), Val (2025-07 to 2025-11), Test (2025-12 to 2026-03). Leakage tests pass (0 future field intrusions). |
| **Overfitting / Underfitting Audit** | ✅ Well-Regularized | Train vs Val vs Test generalization gap analyzed. Production models have F1 gap $< 0.02$. `reports/overfitting_underfitting.md` generated. |
| **Explainable AI (SHAP)** | ✅ Integrated | `shap.TreeExplainer` and `shap.LinearExplainer` generate global beeswarm summaries and local top-3 risk driver attributions. |
| **Anomaly Sentinel** | ✅ Integrated | Isolation Forest scores data integrity (NORMAL, UNUSUAL, ANOMALOUS, REQUIRES_VERIFICATION). Strictly zero "fraud" terminology. |
| **Deterministic Risk Scoring** | ✅ Bounds & Monotonic | Risk score $0 \le S \le 100$, 4 tiers (LOW, MEDIUM, HIGH, CRITICAL), velocity, acceleration, trajectory, and "What Changed?" decomposition. |
| **Current Data Inference (Apr–Jul 2026)** | ✅ 6,228 Records Scored | Treated strictly as unseen current operational data (unobserved future labels). `reports/current_data_predictions.csv` generated. |
| **MLflow Experiment Tracking & Registry** | ✅ Persisted to SQLite | Runs logged to `sqlite:///mlflow.db`; production models registered with semantic tags, input schemas, and metadata cards. |
| **Automated Test Suite** | ✅ 42 / 42 Passed (100%) | 17 data tests + 25 ML tests passing in 2.92s with zero regressions. |
| **FastAPI Contract Schema** | ✅ Frozen & Documented | Stable Pydantic-compatible JSON schema defined for downstream consumption. |

---

## 2. Model Performance & Evaluation Matrix

All models were evaluated using strictly chronological holdout splits:
- **Historical Train**: 5,329 records ($2023\text{-}01\text{ to }2025\text{-}06$)
- **Temporal Validation**: 1,790 records ($2025\text{-}07\text{ to }2025\text{-}11$)
- **Temporal Holdout Test**: 2,538 records ($2025\text{-}12\text{ to }2026\text{-}03$)
- **Current Operational / Unseen**: 6,228 records ($2026\text{-}04\text{ to }2026\text{-}07$)

### Comprehensive Model Performance Table

| Target | Feature Set | Model Algorithm | Val F1 | Val Recall | Val ROC-AUC | Val PR-AUC | Test F1 | Test Recall | Test ROC-AUC | Test PR-AUC | Selection Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Schedule Delay** | CUF (10) | Logistic Regression | **0.9970** | **0.9953** | **0.9934** | **0.9971** | **0.9837** | **0.9698** | **0.9845** | **0.9912** | 🏆 **SELECTED (PROD)** |
| Schedule Delay | CUF (10) | Random Forest | 0.9970 | 0.9953 | 0.9935 | 0.9973 | 0.9837 | 0.9698 | 0.9904 | 0.9952 | Candidate |
| Schedule Delay | CUF (10) | XGBoost | 0.9970 | 0.9953 | 0.9934 | 0.9972 | 0.9837 | 0.9698 | 0.9889 | 0.9944 | Candidate |
| Schedule Delay | Enhanced (48) | Logistic Regression | 0.9940 | 0.9933 | 0.9948 | 0.9977 | 0.9839 | 0.9708 | 0.9889 | 0.9945 | Candidate |
| Schedule Delay | Enhanced (48) | Random Forest | 0.9970 | 0.9953 | 0.9934 | 0.9973 | 0.9837 | 0.9698 | 0.9916 | 0.9957 | Candidate |
| Schedule Delay | Enhanced (48) | XGBoost | 0.9970 | 0.9953 | 0.9927 | 0.9970 | 0.9837 | 0.9698 | 0.9903 | 0.9951 | Candidate |
| **Cost Overrun** | CUF (10) | Logistic Regression | 0.6467 | 0.9502 | 0.9655 | 0.8142 | 0.6235 | 0.9155 | 0.9629 | 0.7719 | Sub-optimal |
| Cost Overrun | CUF (10) | Random Forest | 0.7543 | 0.9234 | 0.9800 | 0.8932 | 0.6920 | 0.8345 | 0.9617 | 0.8407 | Sub-optimal |
| Cost Overrun | CUF (10) | XGBoost | 0.9286 | 0.9464 | 0.9875 | 0.9664 | 0.8705 | 0.8521 | 0.9822 | 0.9126 | Candidate |
| Cost Overrun | Enhanced (48) | Logistic Regression | 0.8761 | 0.9617 | 0.9818 | 0.9257 | 0.8562 | 0.9120 | 0.9829 | 0.9064 | Candidate |
| **Cost Overrun** | Enhanced (48) | Random Forest | **0.9773** | **0.9885** | **0.9980** | **0.9941** | **0.9606** | **0.9437** | **0.9852** | **0.9683** | 🏆 **SELECTED (PROD)** |
| Cost Overrun | Enhanced (48) | XGBoost | 0.9754 | 0.9885 | 0.9946 | 0.9892 | 0.9658 | 0.9437 | 0.9875 | 0.9703 | Candidate |

### Key Lift Analysis (CUF vs Enhanced)
For Cost Overrun prediction, traditional CUF baseline attributes lack dynamic financial burn-rate and milestone pacing metrics, resulting in poor precision ($F_1 = 0.6920$). Incorporating Enhanced feature engineering (capital velocity, expenditure-to-progress ratio, milestone lag) produces an extraordinary performance lift:
- **Recall Lift**: $+13.08\%$ ($83.45\% \rightarrow 94.37\%$)
- **F1 Score Lift**: $+38.82\%$ ($0.6920 \rightarrow 0.9606$)
- **PR-AUC Lift**: $+15.18\%$ ($0.8407 \rightarrow 0.9683$)

---

## 3. Generalization & Overfitting Diagnosis

To ensure robustness in real-world deployment, every candidate model was diagnosed across training, validation, and holdout test sets (`reports/overfitting_underfitting.md`):

| Model | Train F1 | Val F1 | Test F1 | Generalization Gap | Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `schedule_delay_cuf_logistic_regression` | 0.9987 | 0.9970 | 0.9837 | **0.0150** | **Well-Regularized** |
| `cost_overrun_enhanced_random_forest` | 0.9806 | 0.9773 | 0.9606 | **0.0200** | **Well-Regularized** |

Neither production model displays overfitting ($\text{Gap} \le 0.02$) or underfitting ($\text{Train } F_1 > 0.98$).

---

## 4. Explainable AI & Anomaly Sentinel Integration

### A. Explainable AI (SHAP)
- **Schedule Delay Drivers**: `schedule_progress_gap_pct` (physical progress vs elapsed lifecycle) and `elapsed_duration_pct` dominate log-odds of delay.
- **Cost Overrun Drivers**: `expenditure_to_original_cost_pct` (burn rate ahead of physical progress) and `cost_variance_pct` dominate budget overrun probability.
- **Plots**: Generated in `reports/figures_ml/shap_summary_schedule_delay.png` and `reports/figures_ml/shap_summary_cost_overrun.png`.

### B. Anomaly Sentinel (Isolation Forest)
- **Model**: Scikit-Learn `IsolationForest` trained on 5,329 historical training observations (10 features, $5\%$ contamination).
- **Output Tiers**:
  - `NORMAL`: Decision function $\ge 0.05$ (80.3% of current data)
  - `UNUSUAL`: Decision function $[0.00, 0.05)$ (8.6% of current data)
  - `ANOMALOUS`: Decision function $[-0.05, 0.00)$ (7.0% of current data)
  - `REQUIRES_VERIFICATION`: Decision function $< -0.05$ (4.1% of current data)
- **Compliance**: Zero occurrence of "fraud" terminology in code, schemas, or docs.

---

## 5. Current Data Inference (April–July 2026)

The unseen operational dataset (6,228 observations across 1,719 distinct infrastructure projects) was transformed and scored using the production pipeline:
- **Output Artifact**: `reports/current_data_predictions.csv` & `data/processed/paimana_current_data_predictions.csv`
- **Mean Risk Score**: $48.21 / 100$
- **Risk Distribution**:
  - `CRITICAL`: 615 records (9.9%)
  - `HIGH`: 3,684 records (59.2%)
  - `MEDIUM`: 568 records (9.1%)
  - `LOW`: 1,361 records (21.8%)
- **Trajectory Distribution**:
  - `STABLE`: 5,713 records (91.7%)
  - `DE_ESCALATING`: 186 records (3.0%)
  - `RAPID_ESCALATION`: 165 records (2.6%)
  - `MODERATE_RISE`: 164 records (2.6%)
- **Intervention Priorities**:
  - `CRITICAL_INTERVENTION`: 204 projects requiring immediate ministry escalation.

---

## 6. Model Artifacts Lineage & Registry

The production models have been serialized and cataloged into the MLflow Model Registry (`sqlite:///mlflow.db`):

| Model Name | Registry Version | Stage | Pipeline File |
| :--- | :---: | :---: | :--- |
| `Schedule_Delay_Predictor` | 5 | Production | `models/schedule_delay/production_model.pkl` |
| `Cost_Overrun_Predictor` | 5 | Production | `models/cost_overrun/production_model.pkl` |
| `Project_Anomaly_Sentinel` | 4 | Production | `models/anomaly_detector/production_anomaly_detector.pkl` |

Metadata, feature columns, metrics, and parameters are cataloged in `reports/mlops_registry_catalog.json` and `models/selected_models_summary.json`.

---

## 7. Stable FastAPI Contract Specification

When the FastAPI integration phase begins, the backend will consume and return predictions strictly conforming to this Pydantic-compatible JSON schema:

```json
{
  "project_code": "string",
  "prediction_timestamp": "string (ISO-8601)",
  "schedule_delay_probability": "float (0.0000 - 1.0000)",
  "cost_overrun_probability": "float (0.0000 - 1.0000)",
  "schedule_delay_flag": "integer (0 or 1)",
  "cost_overrun_flag": "integer (0 or 1)",
  "overall_risk_score": "float (0.0 - 100.0)",
  "risk_level": "string (LOW | MEDIUM | HIGH | CRITICAL)",
  "risk_velocity": "float",
  "risk_acceleration": "float",
  "risk_trajectory": "string (STABLE | MODERATE_RISE | RAPID_ESCALATION | DE_ESCALATING)",
  "intervention_priority": "string (LOW | MEDIUM | HIGH | CRITICAL_INTERVENTION)",
  "anomaly_score": "float (-1.0000 to +1.0000)",
  "anomaly_status": "string (NORMAL | UNUSUAL | ANOMALOUS | REQUIRES_VERIFICATION)",
  "top_risk_drivers": [
    {
      "feature": "string",
      "impact": "float",
      "direction": "string (INCREASES_RISK | DECREASES_RISK)"
    }
  ],
  "what_changed": {
    "progress_delta": "float",
    "expenditure_delta": "float",
    "schedule_slippage_delta": "float",
    "cost_overrun_delta": "float",
    "explanation": "string"
  },
  "metadata": {
    "data_status": "SYNTHETIC / DEMONSTRATION",
    "model_versions": {
      "schedule_delay": "1.0.0",
      "cost_overrun": "1.0.0",
      "anomaly_sentinel": "1.0.0"
    }
  }
}
```

---

## 8. Conclusion & Readiness

The ML and MLOps phase is **100% complete and verified**. All DVC stages execute cleanly and reproduce on demand. The test suite passes with zero errors. The model prediction contract is stable and prepared for Phase 2: FastAPI backend service integration.
