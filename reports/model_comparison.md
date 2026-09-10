# SIH26103 — Controlled Model Comparison & CUF Benchmark Report

**Document ID**: `MOSPI-PAIMANA-ML-002`  
**Problem Statement**: SIH26103 — AI-Powered Predictive Analytics and Early Warning System for Infrastructure Projects (PAIMANA / MoSPI)  
**System Version**: `v1.0.0`  
**Data Status**: `SYNTHETIC / DEMONSTRATION`  

---

> [!IMPORTANT]
> **Data Status Notice**: The performance metrics reported below are obtained on **SYNTHETIC / DEMO DATA**. They demonstrate pipeline validity, algorithm benchmarks, and feature engineering lift. They must not be cited as real MoSPI PAIMANA project statistics.

---

## 1. Controlled Model Zoo & Experimental Setup

To objectively measure whether advanced machine learning and feature engineering outperform conventional administrative heuristics, a controlled factorial experiment was executed:
- **Algorithms**:
  1. **Baseline 1**: Logistic Regression (`L2` penalty, `class_weight='balanced'`)
  2. **Baseline 2**: Random Forest Classifier (150 trees, `max_depth=8`, `min_samples_split=5`)
  3. **Candidate 3**: XGBoost Classifier (150 estimators, `max_depth=5`, `learning_rate=0.05`, `scale_pos_weight` tuned to class imbalance)
- **Feature Sets**:
  - **CUF Baseline** (10 features): Conventional Common Utility Format fields (`original_cost_cr`, `cumulative_expenditure_cr`, `physical_progress_pct`, `approval_to_start_days`, `planned_duration_days`, etc.)
  - **Enhanced ML** (48 features): Augments CUF with physical progress velocity (`progress_delta_recent`), expenditure burn rate, schedule-progress gap, marginal efficiencies, and 16 missingness indicator flags.
- **Validation**: Strict temporal split:
  - Training: 2025-04 to 2025-11 (5,329 records)
  - Validation: 2025-12 to 2026-01 (1,790 records)
  - Holdout Test: 2026-02 to 2026-03 (2,538 records)

---

## 2. Benchmark Results Across All Models

### Target A: Future Schedule Delay (`future_schedule_delay`)
*Class Prevalence*: $74.6\%$ delayed in historical sequence.

| Feature Set | Model Architecture | Val F1 | Val Recall | Val ROC-AUC | Test Precision | Test Recall | Test F1 | Test ROC-AUC | Test PR-AUC |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **CUF Baseline** | Logistic Regression | 0.9970 | 0.9953 | 0.9934 | 0.9980 | 0.9698 | **0.9837** | 0.9845 | 0.9967 |
| **CUF Baseline** | Random Forest | 0.9970 | 0.9953 | 0.9935 | 0.9980 | 0.9698 | **0.9837** | 0.9904 | 0.9978 |
| **CUF Baseline** | XGBoost | 0.9970 | 0.9953 | 0.9934 | 0.9980 | 0.9698 | **0.9837** | 0.9889 | 0.9976 |
| **Enhanced ML** | Logistic Regression | 0.9940 | 0.9933 | 0.9948 | 0.9975 | 0.9708 | **0.9839** | 0.9889 | 0.9975 |
| **Enhanced ML** | Random Forest | 0.9970 | 0.9953 | 0.9934 | 0.9980 | 0.9698 | **0.9837** | 0.9916 | 0.9981 |
| **Enhanced ML** | XGBoost | 0.9970 | 0.9953 | 0.9927 | 0.9980 | 0.9698 | **0.9837** | 0.9903 | 0.9978 |

---

### Target B: Future Cost Overrun (`future_cost_overrun`)
*Class Prevalence*: $13.4\%$ overrun (highly imbalanced).

| Feature Set | Model Architecture | Val F1 | Val Recall | Val PR-AUC | Test Precision | Test Recall | Test F1 | Test ROC-AUC | Test PR-AUC |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **CUF Baseline** | Logistic Regression | 0.6467 | 0.9502 | 0.8732 | 0.4727 | 0.9155 | **0.6235** | 0.9629 | 0.8565 |
| **CUF Baseline** | Random Forest | 0.7543 | 0.9234 | 0.9463 | 0.5910 | 0.8345 | **0.6920** | 0.9617 | 0.8764 |
| **CUF Baseline** | XGBoost | 0.9286 | 0.9464 | 0.9641 | 0.8897 | 0.8521 | **0.8705** | 0.9822 | 0.9342 |
| **Enhanced ML** | Logistic Regression | 0.8761 | 0.9617 | 0.9720 | 0.8069 | 0.9120 | **0.8562** | 0.9829 | 0.9498 |
| **Enhanced ML** | Random Forest | 0.9773 | 0.9885 | 0.9941 | 0.9781 | 0.9437 | **0.9606** | 0.9852 | 0.9683 |
| **Enhanced ML** | XGBoost | 0.9754 | 0.9885 | 0.9888 | 0.9889 | 0.9437 | **0.9658** | 0.9875 | 0.9733 |

---

## 3. CUF Baseline vs Enhanced ML Lift Analysis

The SIH problem statement specifically asks: *Does AI/ML and additional engineered variables improve upon conventional CUF-based monitoring?*

The empirical answer is **an unequivocal YES**, especially on complex financial dynamics:

| Target | Model | CUF Test F1 | Enhanced Test F1 | **F1 Relative Lift** | CUF Test Recall | Enhanced Test Recall | **Recall Lift** |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Cost Overrun** | Logistic Regression | 0.6235 | 0.8562 | **+37.32%** | 0.9155 | 0.9120 | -0.38% |
| **Cost Overrun** | Random Forest | 0.6920 | 0.9606 | **+38.82%** | 0.8345 | 0.9437 | **+13.08%** |
| **Cost Overrun** | XGBoost | 0.8705 | 0.9658 | **+10.94%** | 0.8521 | 0.9437 | **+10.74%** |
| **Schedule Delay**| Logistic Regression | 0.9837 | 0.9839 | **+0.03%** | 0.9698 | 0.9708 | **+0.10%** |
| **Schedule Delay**| Random Forest | 0.9837 | 0.9837 | **0.00%** | 0.9698 | 0.9698 | **0.00%** |
| **Schedule Delay**| XGBoost | 0.9837 | 0.9837 | **0.00%** | 0.9698 | 0.9698 | **0.00%** |

### Key Analytical Takeaways:
1. **Dramatic Lift on Financial Creep**: CUF features alone produce poor precision on cost overrun ($47.3\%$ for Logistic Regression, $59.1\%$ for Random Forest) due to high false positive rates. Enhanced features (spend burn rate, marginal efficiency, remaining cost buffer) boost precision to $97.8\%–98.9\%$, generating a **$+38.8\%$ F1 improvement**.
2. **Recall for High-Risk Projects**: On cost overrun, enhanced tree models miss fewer failing projects, boosting recall from $83.5\%$ to $94.4\%$ (**$+13.1\%$ increase in delayed/overrun project capture**).

---

## 4. Winning Model Selection Decision

Per project guidelines, selection was made strictly via predefined validation metrics:
* **Selected Schedule Delay Predictor**: `schedule_delay_cuf_logistic_regression` (tied with tree models on validation F1 $0.9970$ and test F1 $0.9837$; chosen for statistical parsimony and government auditability).
* **Selected Cost Overrun Predictor**: `cost_overrun_enhanced_random_forest` (achieved highest validation PR-AUC of $0.9941$, test F1 $0.9606$, test recall $0.9437$, and outstanding probability calibration).
