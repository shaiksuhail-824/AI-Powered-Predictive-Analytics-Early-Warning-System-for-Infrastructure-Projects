# SIH 2026 Live Demo Script — MoSPI PAIMANA

**Smart India Hackathon 2026 | Problem Statement SIH26103**  
**Presentation Timing:** 5 to 7 Minutes  
**Target Audience:** SIH Jury Panel, MoSPI Evaluators, Technical Experts  

---

## Pre-Demo Checklist (Execute 10 Minutes Before Presentation)

1. Launch Docker Compose stack:
   ```bash
   docker compose up -d
   ```
2. Confirm both services are healthy:
   * Backend: `curl http://localhost:8000/api/v1/health` (must return `"status": "healthy"`)
   * Frontend: Open `http://localhost:3000` in browser (Chrome / Edge)
3. Open required browser tabs in advance:
   * **Tab 1:** `http://localhost:3000` (Home Landing Page)
   * **Tab 2:** `http://localhost:3000/admin/dashboard` (Executive Dashboard)
   * **Tab 3:** `http://localhost:8000/api/v1/docs` (Swagger API Docs)
   * **Tab 4:** Terminal showing `docker compose ps` and `git status`

---

## Demo Script (Timeline & Narration)

### Minute 0:00 – 1:00 | The Hook, Problem & Strategic Context
* **What to Open:** Tab 1 (`http://localhost:3000`)
* **What to Show:** Hero landing section showcasing Indian infrastructure scale.
* **What to Say:**
  > *"Respected Jury, India is currently executing the most ambitious infrastructure expansion in its history. Under MoSPI's Infrastructure and Project Monitoring Division, over 3,500 central sector projects worth lakhs of crores are tracked. However, historical data reveals a stark reality: over 72% of these mega-projects face schedule slippage, with an average delay exceeding 30 months.*
  > 
  > *The root problem is not a lack of reporting—it is that current flash reporting is retrospective. Decision-makers learn about a crisis 3 to 6 months after the physical progress on site has already decoupled from expenditure. Today, our team presents **MoSPI PAIMANA**: an AI-powered early-warning platform that transforms reactive monitoring into predictive governance."*
* **Expected Result:** Clear, compelling opening framing the real-world administrative stakes.
* **Backup Plan:** If browser is slow to load, show slide with the 72.61% historical delay statistic.

---

### Minute 1:00 – 2:30 | Executive Dashboard, India Map & State Drilldown
* **What to Open:** Tab 2 (`http://localhost:3000/admin/dashboard`)
* **What to Click:** Hover over states on the interactive India map (e.g. Maharashtra, Jammu & Kashmir). Click on **Maharashtra**.
* **What to Say:**
  > *"Here is the National Executive Dashboard. At a single glance, senior leadership sees the pulse of the national portfolio: 3,531 central projects indexed, total delayed count, and our portfolio-wide risk distribution.*
  > 
  > *This interactive TopoJSON choropleth map color-codes every State and Union Territory by its dominant risk score. When I click on Maharashtra, the system drills down into state-level metrics: total active projects, CPSE agency distribution, and the top high-risk projects in the region. Notice how seamlessly the interface navigates—this is powered by Next.js 14 server rendering connected to our FastAPI repository."*
* **Expected Result:** Route updates to `/admin/state/maharashtra` showing dynamic project metrics and CPSE breakdown.
* **Backup Plan:** If SVG map interaction is sluggish, use the top search bar to navigate directly to projects.

---

### Minute 2:30 – 4:00 | Project Deep Dive, AI Predictions & SHAP Explainability
* **What to Click:** Navigate to `/projects`, search for project `060100093` (Udhampur-Srinagar-Baramulla Rail Link), and click into it. Then click **"AI Risk Analysis"** tab.
* **What to Show:** Project Financial Escalation cards, Schedule Delay gauge, and SHAP Attribution Breakdown.
* **What to Say:**
  > *"Let us drill into a landmark project: the USBRL rail link. The system highlights immediate early-warning signals: revised cost has escalated from ₹2,500 Crore to over ₹37,000 Crore, and schedule slippage stands at 144 months.*
  > 
  > *Now look at our **AI Risk Analysis**. Our dual-target machine learning models predict an 84% probability of further delay and a 78.5 Composite Risk Score, categorizing this as CRITICAL.*
  > 
  > *Crucially, PAIMANA is never a black box. Look at these SHAP feature attribution cards: the system explicitly informs the administrator that 42.5% of this risk is driven by the negative Schedule-Progress Gap—physical progress has stalled while capital expenditure continues to burn. This causal explainability gives project engineers concrete targets for intervention."*
* **Expected Result:** High-fidelity metrics render with visual progress bars and ranked SHAP feature impacts.
* **Backup Plan:** Use static pre-computed prediction cards in `reports/figures_ml/shap_summary_schedule_delay.png`.

---

### Minute 4:00 – 5:15 | Scenario Simulator & Early Warning Alerts
* **What to Click:** Navigate to `/projects/060100093/monthly-update`. Move the "Physical Progress" slider up from 77% to 90%, and click "Recalculate Risk".
* **What to Say:**
  > *"Before submitting official monthly returns, project directors can utilize our **Scenario Simulator**. If the PMC accelerates physical progress by 13% over the next quarter, look at how the composite risk score immediately recalculates—dropping from Critical to Moderate. This gamifies and incentivizes corrective milestone recovery.*
  > 
  > *Simultaneously, our automated sentinel scans the entire portfolio and surfaces automated early-warning alerts on `/alerts`, categorizing urgent interventions for immediate ministerial action."*
* **Expected Result:** Risk gauge dynamically updates in real time reflecting the simulated scenario.
* **Backup Plan:** Explain the mathematical formula of the multi-dimensional risk index.

---

### Minute 5:15 – 6:30 | Technical Foundation, MLOps & API Demonstration
* **What to Open:** Tab 3 (`http://localhost:8000/api/v1/docs`) and Tab 4 (Terminal).
* **What to Show:** Swagger UI running `/api/v1/health` and terminal showing passing tests.
* **What to Say:**
  > *"Under the hood, PAIMANA is built on rigorous MLOps standards:*
  > * *Our data pipeline is codified in a 10-stage DVC pipeline tracking 17,697 real project records with zero temporal leakage.*
  > * *Our models achieve **0.984 ROC-AUC for schedule delays** and **0.968 PR-AUC for cost overruns**, tracked in our MLflow model registry.*
  > * *Our FastAPI backend exposes 9 secured, fully-typed OpenAPI endpoints protected by JWT authentication and Role-Based Access Control.*
  > * *Our entire stack is containerized with Docker Compose and continuously verified through GitHub Actions CI with 80 passing automated tests."*
* **Expected Result:** Clean Swagger UI displaying 200 OK responses with microsecond latency.
* **Backup Plan:** Show `reports/training_run_summary.csv` and `dvc.yaml`.

---

### Minute 6:30 – 7:00 | Impact, Feasibility & Conclusion
* **What to Show:** Return to Tab 1 (Landing Page).
* **What to Say:**
  > *"To conclude: MoSPI PAIMANA is not a mockup. It is a working, tested, reproducible end-to-end early warning system. By detecting infrastructure distress 3 to 6 months in advance, PAIMANA has the potential to save thousands of crores in public capital and ensure India's mega-projects finish on time, every time. Thank you, and we look forward to your questions."*
