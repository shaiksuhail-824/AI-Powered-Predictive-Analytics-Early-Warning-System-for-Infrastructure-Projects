# SIH26103 — Explainable AI (XAI) & SHAP Interpretability Report

**Document ID**: `MOSPI-PAIMANA-ML-005`  
**Problem Statement**: SIH26103 — AI-Powered Predictive Analytics and Early Warning System for Infrastructure Projects (PAIMANA / MoSPI)  
**System Version**: `v1.0.0`  
**Data Status**: `SYNTHETIC / DEMONSTRATION`  

---

> [!IMPORTANT]
> **Data Status Notice**: Attributions below are computed from **SYNTHETIC / DEMO DATA**. They demonstrate feature attribution logic and FastAPI readiness for administrative review.

---

## 1. XAI Architecture & Methodology

Black-box predictions cannot be operationalized in government infrastructure oversight. Project officers and administrative secretaries require transparent causal justification before ordering site audits or issuing show-cause notices.

The PAIMANA XAI engine integrates **SHAP (SHapley Additive exPlanations)** grounded in cooperative game theory to guarantee local accuracy and consistency:
- **Tree-Based Models** (Cost Overrun Random Forest): `shap.TreeExplainer` computing exact Shapley feature attribution values in polynomial time.
- **Linear Models** (Schedule Delay Logistic Regression): `shap.LinearExplainer` / standardized coefficient attribution mapping feature log-odds shifts.

---

## 2. Global Risk Drivers Analysis

### A. Cost Overrun Global Drivers (`reports/figures_ml/shap_summary_cost_overrun.png`)
The global beeswarm summary identifies the primary macro drivers determining whether a project overshoots its sanctioned budget:
1. **`expenditure_to_original_cost_pct`** (Dominant Positive Driver):
   - Projects where cumulative disbursements exceed $80\%–90\%$ of sanctioned cost while physical progress remains low exhibit massive positive SHAP values ($+0.25$ to $+0.40$).
2. **`cost_variance_pct` & `cost_variance_cr`**:
   - Negative financial headroom (`remaining_original_cost_cr < 0`) is a decisive indicator of fiscal exhaustion.
3. **`expenditure_burn_rate`**:
   - High capital disbursement velocity without commensurate physical milestone progress signals rapid budget depletion.
4. **`recent_spend_efficiency_cr_pct`**:
   - Spikes in marginal expenditure per percentage progress indicate contractor billing surges preceding formal cost revisions.

### B. Schedule Delay Global Drivers (`reports/figures_ml/shap_summary_schedule_delay.png`)
1. **`schedule_progress_gap_pct`**:
   - Severe negative gap between physical progress and elapsed project lifecycle duration is the single strongest indicator of systemic milestone slippage.
2. **`elapsed_duration_pct`**:
   - Projects that have consumed $>100\%$ of sanctioned duration without reaching practical completion have near-certain probability of delay.
3. **`progress_per_elapsed_month`**:
   - Chronic sluggishness ($<1\%$ physical progress per active month) indicates systemic coordination or contractor bottlenecks.

---

## 3. Project-Level Local Attribution Examples

### Case 1: High-Risk Infrastructure Project (Project Code: `400010`)
* **Predicted Risk Level**: `CRITICAL`
* **Schedule Delay Probability**: $0.982$
* **Cost Overrun Probability**: $0.924$
* **Overall Risk Score**: $84.6$
* **Risk Trajectory**: `RAPID_ESCALATION` ($\Delta_{\text{risk}} = +11.2$)
* **Top Risk Drivers (Local SHAP)**:
  1. `schedule_progress_gap_pct` ($-48.2\%$): **$+0.312$** (Severe physical delivery lag behind calendar elapsed duration)
  2. `expenditure_to_original_cost_pct` ($114.5\%$): **$+0.245$** (Cumulative spend has breached initial sanctioned budget)
  3. `progress_stagnation` ($1.0$): **$+0.168$** (Zero physical milestone movement in the latest reporting month)
  4. `expenditure_burn_rate` (₹$18.4$ Cr/mo): **$+0.104$** (High monthly cash burn despite stagnation)
* **Top Protective Factor**:
  1. `approval_to_start_days` ($120$ days): **$-0.042$** (Prompt initial project commencement)

---

### Case 2: Healthy Infrastructure Project (Project Code: `400155`)
* **Predicted Risk Level**: `LOW`
* **Schedule Delay Probability**: $0.038$
* **Cost Overrun Probability**: $0.012$
* **Overall Risk Score**: $14.2$
* **Risk Trajectory**: `STABLE`
* **Top Protective Drivers (Local SHAP)**:
  1. `schedule_progress_gap_pct` ($+12.4\%$): **$-0.285$** (Physical progress leading planned timeline)
  2. `expenditure_to_original_cost_pct` ($42.1\%$): **$-0.210$** (Fiscal outlay aligned with $48\%$ completion)
  3. `progress_per_elapsed_month` ($3.8\%$/mo): **$-0.144$** (Rapid milestone execution rate)

---

## 4. FastAPI Integration Contract
Every project prediction returned by `src/ml/predict.py` packages structured XAI driver cards conforming to the JSON schema:
```json
"top_risk_drivers": [
  {"feature": "schedule_progress_gap_pct", "value": -48.2, "impact": 0.312},
  {"feature": "expenditure_to_original_cost_pct", "value": 114.5, "impact": 0.245},
  {"feature": "progress_stagnation", "value": 1.0, "impact": 0.168},
  {"feature": "expenditure_burn_rate", "value": 18.4, "impact": 0.104}
]
```
This payload is directly consumable by frontend dashboard risk cards, project officer summaries, and automated early warning notification dispatches.
