# Judge FAQ & Technical Defense — MoSPI PAIMANA

**Smart India Hackathon 2026 | Problem Statement SIH26103**  
**Preparation:** Concise, Verifiable Answers to High-Frequency Technical & Domain Questions  

---

### Q1: What exact problem does MoSPI PAIMANA solve?
**Answer:** Traditional central infrastructure monitoring relies on retrospective monthly flash reports where delays and budget escalations are officially recorded 60 to 90 days after physical work has already slowed down. PAIMANA replaces retrospective reporting with forward-looking predictive analytics, detecting schedule delay and cost overrun risk signals 3 to 6 months in advance.

---

### Q2: Who are the primary target users?
**Answer:** 
1. **National Leadership (MoSPI IPMD / PMO):** For macro-level portfolio risk indices and inter-state benchmarking.
2. **Ministry Project Heads (Railways, MoRTH, Power):** For sectoral oversight and milestone review across CPSEs.
3. **CPSE Project Directors & PMC Engineers (NHAI, RVNL, NTPC):** For root-cause diagnosis, monthly update simulation, and corrective action planning.
4. **Citizens & Public:** For transparent tracking of sanctioned budgets and progress.

---

### Q3: What is genuinely innovative about your approach?
**Answer:** 
* **Strict Anti-Leakage Temporal Feature Engineering:** Unlike standard models that accidentally use future data, our features strictly respect the reporting cutoff timestamp $T$.
* **Domain-Specific Indices:** We formulated the *Schedule-Progress Gap* ($\text{physical progress} - \text{elapsed duration ratio}$) and *Capital Burn Velocity* which capture leading risk signals before deadlines expire.
* **Dual-Target + Anomaly Sentinel:** Simultaneously predicts time delay, cost escalation, and uncovers reporting irregularities without pejorative fraud labeling.
* **Transparent Explainability:** Every prediction is paired with real-time TreeSHAP / LinearSHAP attributions.

---

### Q4: Why use Machine Learning instead of standard statistical threshold rules?
**Answer:** Infrastructure projects exhibit complex, multi-dimensional non-linear interactions. A project lagging by 10% in month 6 of a 5-year bridge construction has vastly different recovery dynamics than a project lagging by 10% in month 58. Linear threshold rules generate massive false alarms; machine learning models capture interaction effects between capital burn rate, pre-construction lag, agency scale, and physical completion velocity.

---

### Q5: How are schedule delays and cost overruns predicted?
**Answer:**
* **Schedule Delay:** Uses our production Logistic Regression pipeline on 10 Common Underlying Features (CUF), achieving **0.9837 Test F1** and **0.9845 Test ROC-AUC**. The schedule-progress gap provides high separability.
* **Cost Overrun:** Uses our production Random Forest ensemble on 48 Enhanced features, achieving **0.9606 Test F1** and **0.9683 Test PR-AUC**, overcoming severe class imbalance where cost overruns occur in a minority of early snapshot records.

---

### Q6: How is the Composite Project Risk Score calculated?
**Answer:** The risk score ($0 - 100$) integrates four weighted components:
$$\text{Risk Score} = 0.35 \cdot P(\text{Delay}) + 0.35 \cdot P(\text{Cost Overrun}) + 0.20 \cdot \text{Normalized Slippage Gap} + 0.10 \cdot \text{Anomaly Penalty}$$
This yields intuitive, standardized tiers: Low ($<25$), Medium ($25-50$), High ($50-75$), and Critical ($>75$).

---

### Q7: How do you prevent false alarms and model hallucination?
**Answer:** 
1. **Calibrated Probabilities:** Evaluated with Brier scores ($0.025$ for delay, $0.009$ for cost overrun) ensuring output probabilities match empirical frequencies.
2. **Monotonicity Enforcement:** Automated unit tests (`tests/ml/test_risk_score.py`) verify that risk scores strictly increase as delay probability or slippage gap worsens.
3. **Missingness Preservation:** We create explicit binary indicator flags (`*_missing`) so the model accounts for missing data rather than hallucinating imputed values.

---

### Q8: How do you explain predictions to non-technical government administrators?
**Answer:** Through integrated **SHAP (SHapley Additive exPlanations)**. The frontend renders ranked attribution cards showing the top factors driving the score (e.g., *“+32% risk from negative schedule-progress gap; +18% risk from capital expenditure burn rate exceeding physical progress”*).

---

### Q9: Why did you use a Chronological Temporal Split instead of K-Fold Cross-Validation?
**Answer:** K-Fold cross-validation randomly shuffles rows, allowing future observations from 2026 to train models that predict events in 2024. This represents temporal data leakage. We split the authoritative 17,697 records strictly chronologically: the earliest 70% for Training (12,387 rows), middle 15% for Validation (2,655 rows), and most recent 15% for Testing (2,655 rows).

---

### Q10: How are datasets and pipeline stages versioned?
**Answer:** Using **DVC (Data Version Control)**. The 10-stage execution DAG is defined in `dvc.yaml` and locked with cryptographic SHA256 hashes in `dvc.lock`. Running `dvc repro` reproduces the exact preprocessing, training, and evaluation steps deterministically.

---

### Q11: How are experiments and models tracked?
**Answer:** Using **MLflow**. Every training run logs hyperparameters, training curves, confusion matrices, ROC/PR curves, and evaluation metrics to `mlflow.db`. Selected models are registered into the MLflow Model Registry and cataloged in `reports/mlops_registry_catalog.json`.

---

### Q12: How is the system deployed today? Is AWS already deployed?
**Answer:** 
* **Today:** The system is **fully deployed and operational locally via Docker Compose**. The multi-container stack (`paimana-backend` on port 8000, `paimana-frontend` on port 3000) is verified by automated GitHub Actions CI.
* **AWS Cloud:** The AWS architecture (ECS Fargate, ALB, ECR, Route 53) is fully designed and documented, but **cloud resources are planned and not yet provisioned**, adhering strictly to honest SIH reporting.

---

### Q13: How is the system secured?
**Answer:**
* **JWT Authentication:** Cryptographically signed HS256 tokens with 12-hour expirations.
* **Role-Based Access Control (RBAC):** Three strictly enforced tiers (`ADMIN`, `MINISTRY_PROJECT_HEAD`, `AGENCY_CONTRACTOR`).
* **Input Validation:** Strict Pydantic v2 schemas reject malformed or out-of-bound inputs.
* **Container Security:** Frontend container executes as unprivileged system user `nextjs` (UID 1001) on minimal Alpine Linux.
* **Zero Secret Exposure:** Verified that no production credentials or private keys are committed to Git.

---

### Q14: What are the primary technical limitations of the current prototype?
**Answer:**
1. In-memory data repository: Currently indexes 3,531 projects and 17,697 snapshots in memory; scaling to 100,000+ local bodies requires external PostgreSQL.
2. OCR and PDF ingestion: Ingests structured CSV representations; direct computer vision parsing of scanned contractor DPR documents is scheduled for Phase 2.
3. Static CDN hosting: Requires active Node/Python servers and cannot run on static GitHub Pages.

---

### Q15: What will the team implement next after the hackathon?
**Answer:**
1. Automated OCR pipeline for physical PDF inspection reports.
2. PostgreSQL + TimescaleDB migration for temporal queries.
3. Read-only government intranet connectors to MoSPI's internal OCMS database.
4. Continuous model drift detection using Evidently AI and automated MLflow retraining alerts.
