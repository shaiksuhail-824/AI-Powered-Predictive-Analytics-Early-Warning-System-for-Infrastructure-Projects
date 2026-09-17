# System Architecture — MoSPI PAIMANA

**Smart India Hackathon 2026 | Problem Statement SIH26103**  
**System Name:** MoSPI PAIMANA (*Predictive Analytics and Integrated Monitoring for Automated National Alerts*)  

---

## 1. High-Level Architecture Overview

MoSPI PAIMANA is designed as an enterprise, containerized, multi-layer analytics platform that bridges raw public infrastructure records with real-time operational governance. The architecture is decoupled into five distinct functional layers:

1. **Data Foundation & Versioning Layer (DVC & Git):** Manages raw data ingestion, parameter-driven cleaning, schema integrity gates, and anti-leakage feature generation.
2. **Machine Learning & Experiment Tracking Layer (Scikit-Learn, XGBoost, MLflow):** Manages model training, hyperparameter optimization, model registry stage management, and SHAP explainability.
3. **Backend Service & API Gateway Layer (FastAPI, Python 3.12, Uvicorn):** Serves cached in-memory project repositories, executes real-time inference, and enforces JWT role-based access control.
4. **Frontend User Experience Layer (Next.js 14, React 18, TypeScript, Tailwind CSS):** Delivers responsive, high-fidelity national, ministry, and project dashboards with TopoJSON choropleth maps and interactive simulation.
5. **Continuous Verification & Deployment Layer (Docker, Docker Compose, GitHub Actions):** Ensures containerized reproducibility, automated CI testing, and cloud readiness.

---

## 2. Mermaid Architectural Diagrams

### Diagram 1: High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client & Visualization Layer (Next.js 14 / Node 20)"]
        UI_Admin["National Executive Portal<br/>(Choropleth Map / Portfolio Risk)"]
        UI_Ministry["Ministry Portal<br/>(Sectoral Drilldown)"]
        UI_Agency["Agency / Contractor Portal<br/>(Monthly Update & Simulation)"]
        UI_Public["Public Transparency Portal<br/>(Project Search)"]
    end

    subgraph APILayer ["Backend Service Layer (FastAPI / Python 3.12)"]
        Gateway["REST API Gateway (/api/v1)"]
        AuthService["Auth & RBAC Service<br/>(JWT HS256 / Role Checks)"]
        ProjectRepo["Project & Observation Repository<br/>(In-Memory Index: 3,531 Projects)"]
        PredictService["Prediction & Risk Engine<br/>(Schedule, Cost & Anomaly Sentinel)"]
        XAIService["Explainable AI Service<br/>(SHAP Feature Attribution)"]
    end

    subgraph MLLayer ["MLOps & Modeling Layer"]
        ModelRegistry["MLflow Model Registry<br/>(Production Model Artifacts)"]
        DVCPipeline["DVC Data & Feature Pipeline<br/>(10 Stages: Ingest to Evaluate)"]
    end

    subgraph DataStorage ["Data & Storage Layer"]
        RawCSV["data/raw/paimana_time_overrun.csv<br/>(17,697 Records)"]
        ProcessedData["data/processed/<br/>(Validated, Cleaned & Indexed)"]
        FeatureStore["data/features/<br/>(CUF Baseline & Enhanced 48 Features)"]
    end

    ClientLayer <-->|HTTPS REST + Bearer Token| Gateway
    Gateway --> AuthService
    Gateway --> ProjectRepo
    Gateway --> PredictService
    PredictService --> XAIService
    PredictService --> ModelRegistry
    DVCPipeline --> DataStorage
    DVCPipeline --> ModelRegistry
```

---

### Diagram 2: Data-Processing Pipeline (DVC Stages)

```mermaid
flowchart TD
    Raw["Raw Ingestion<br/>(data/raw/paimana_time_overrun.csv)"] --> Validate["Data Validation Gate<br/>(src/data/validate.py)"]
    Validate -->|Pass Quality Gate| Interim["Validated Dataset<br/>(data/interim/...)"]
    Interim --> EDA["Exploratory Data Analysis<br/>(reports/figures/)"]
    Interim --> Preprocess["Preprocessing & Type Casting<br/>(src/data/preprocess.py)"]
    Preprocess --> Processed["Processed Dataset<br/>(data/processed/...)"]
    Processed --> FeatEng["Feature Engineering & Anti-Leakage<br/>(src/data/feature_engineering.py)"]
    FeatEng --> CUF["CUF Baseline Features (10)<br/>(data/features/paimana_cuf_baseline.csv)"]
    FeatEng --> Enhanced["Enhanced ML Features (48)<br/>(data/features/paimana_ml_ready_time_overrun.csv)"]
```

---

### Diagram 3: Machine Learning Training & Evaluation Pipeline

```mermaid
flowchart TD
    Data["ML-Ready Feature Matrix<br/>(48 Engineered Features)"] --> Split["Temporal Chronological Split<br/>(Train 70% | Val 15% | Test 15%)"]
    
    subgraph ModelTraining ["Parallel Model Training (src/ml/train.py)"]
        T1["Schedule Delay Models<br/>(LogReg, Random Forest, XGBoost)"]
        T2["Cost Overrun Models<br/>(LogReg, Random Forest, XGBoost)"]
        T3["Anomaly Detection<br/>(IsolationForest Sentinel)"]
    end

    Split --> ModelTraining
    ModelTraining --> Track["MLflow Experiment Tracking<br/>(Parameters, F1, PR-AUC, ROC-AUC)"]
    Track --> Select["Model Selection Engine<br/>(src/ml/model_selection.py)"]
    
    Select --> S1["Selected Schedule Model<br/>(Logistic Regression - 0.984 ROC-AUC)"]
    Select --> S2["Selected Cost Overrun Model<br/>(Random Forest - 0.968 PR-AUC)"]
    Select --> S3["Selected Anomaly Model<br/>(IsolationForest)"]
    
    S1 & S2 & S3 --> Register["MLflow Model Registry<br/>(reports/mlops_registry_catalog.json)"]
```

---

### Diagram 4: Online Prediction & Risk Scoring Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser / Next.js UI
    participant API as FastAPI Gateway (/api/v1/predict)
    participant Auth as Auth & RBAC Middleware
    participant Engine as PredictionService
    participant Models as Production ML Artifacts
    participant XAI as SHAP Explainer

    User->>API: POST /api/v1/predict (SingleProjectPredictionRequest)
    API->>Auth: Validate JWT Token & User Permissions
    Auth-->>API: Authorized (Role: ADMIN / MINISTRY / AGENCY)
    API->>Engine: Generate Predictions for Project Code
    Engine->>Models: Predict Schedule Delay Probability
    Models-->>Engine: P(Delay) = 0.88
    Engine->>Models: Predict Cost Overrun Probability
    Models-->>Engine: P(Cost Overrun) = 0.76
    Engine->>Models: Predict Anomaly Isolation Score
    Models-->>Engine: Anomaly Status = "NORMAL"
    Engine->>XAI: Compute TreeSHAP / LinearSHAP Attributions
    XAI-->>Engine: Top Drivers: [Schedule-Progress Gap (-45%), Expenditure Ratio]
    Engine->>Engine: Calculate Multi-Dimensional Risk Score (0-100) & Priority
    Engine-->>API: SingleProjectPredictionResponse
    API-->>User: JSON Response (Risk Score, Probabilities, Trajectory, SHAP Drivers)
```

---

### Diagram 5: Deployment Architecture (Local vs. AWS ECS + ALB)

```mermaid
flowchart TB
    subgraph LocalStack ["Implemented Local Deployment (Docker Compose)"]
        DockerBridge["paimana-network (Bridge Driver)"]
        C_FE["paimana-frontend<br/>Node.js 20 Runner (:3000)"]
        C_BE["paimana-backend<br/>Python 3.12 / Uvicorn (:8000)"]
        C_FE <-->|Internal HTTP Proxy| C_BE
        DockerBridge --- C_FE
        DockerBridge --- C_BE
    end

    subgraph AWSArchitecture ["AWS Cloud Deployment Architecture (ap-south-1)"]
        Client["Browser Client / Official User"]
        ALB["Application Load Balancer (ALB)<br/>paimana-alb (Multi-AZ)"]
        
        subgraph TargetGroups ["Target Groups (IP Mode)"]
            TG_FE["Frontend Target Group (:3000)<br/>Health Check: /"]
            TG_BE["Backend Target Group (:8000)<br/>Health Check: /api/v1/health"]
        end

        subgraph ECS_Cluster ["Amazon ECS Cluster (paimana-cluster)"]
            ECS_FE["ECS Fargate: paimana-frontend-service<br/>(Port 3000, 0.25 vCPU, 512 MB)"]
            ECS_BE["ECS Fargate: paimana-backend-service<br/>(Port 8000, 0.50 vCPU, 1024 MB)"]
        end
        
        subgraph Registries_Logs ["Container Registries & Observability"]
            ECR["Amazon ECR Repositories<br/>(paimana-frontend & paimana-backend)"]
            CW["CloudWatch Log Groups<br/>(/ecs/paimana-frontend, /ecs/paimana-backend)"]
        end

        Client --> ALB
        ALB -->|Default /*| TG_FE --> ECS_FE
        ALB -->|Path /api/*| TG_BE --> ECS_BE
        ECS_FE -.->|Browser API calls via ALB /api/*| ALB
        ECR -.->|Image Pulls| ECS_FE & ECS_BE
        ECS_FE & ECS_BE --> CW
    end
```

---

### Diagram 6: CI/CD Automated Workflow (GitHub Actions)

```mermaid
flowchart LR
    Push["Git Push / PR to main/dev"] --> Trigger["GitHub Actions Trigger<br/>(.github/workflows/ci.yml)"]
    
    subgraph Job1 ["Job 1: Backend Validation"]
        PySetup["Setup Python 3.12"] --> PipInstall["Install Dependencies"]
        PipInstall --> PytestRun["Run Pytest (80 Tests Pass)"]
    end

    subgraph Job2 ["Job 2: Frontend Validation"]
        NodeSetup["Setup Node.js 20"] --> NpmCI["Clean Install (npm ci)"]
        NpmCI --> TypeCheck["tsc --noEmit"]
        TypeCheck --> LintCheck["npm run lint"]
        LintCheck --> NextBuild["Next.js Production Build"]
    end

    subgraph Job3 ["Job 3: Multi-Container Smoke Test"]
        DockerBuild["Docker Compose Buildx"] --> DockerUp["Docker Compose Up -d"]
        DockerUp --> PollBE["Poll Backend Health (8000)"]
        PollBE --> VerifyBE["Verify Health Payload JSON"]
        VerifyBE --> PollFE["Poll Frontend Ready (3000)"]
        PollFE --> CleanUp["Teardown & Output Logs"]
    end

    Trigger --> Job1
    Trigger --> Job2
    Job1 & Job2 --> Job3
```

---

## 3. Component Details & Interactions

### A. Data Ingestion & Canonical Layer
The canonical data layer is anchored by the authoritative dataset [`data/raw/paimana_time_overrun.csv`](file:///c:/Users/varsh/OneDrive/Documents/AI-Powered-Predictive-Analytics-Early-Warning-System-for-Infrastructure-Projects/data/raw/paimana_time_overrun.csv). The dataset contains 17,697 monthly observations spanning 3,531 central projects.
* **Canonical Fields:** `project_code`, `project_name`, `ministry`, `agency`, `state`, `sector`, `original_cost_cr`, `revised_cost_cr`, `cumulative_expenditure_cr`, `physical_progress_pct`, `time_overrun_days`, `time_overrun_months`, `time_overrun_flag`, `report_year`, `report_month_num`.

### B. Machine Learning Engine & Pipeline
* **Feature Engineering:** Implemented in [`src/data/feature_engineering.py`](file:///c:/Users/varsh/OneDrive/Documents/AI-Powered-Predictive-Analytics-Early-Warning-System-for-Infrastructure-Projects/src/data/feature_engineering.py). Generates two feature sets:
  1. `paimana_cuf_baseline.csv`: 10 core Common Underlying Features for baseline benchmarking.
  2. `paimana_ml_ready_time_overrun.csv`: 48 comprehensive features including temporal progress gaps, expenditure velocity, duration ratios, and normalized geographic weights.
* **Model Artifacts:** Production serialized models stored in `models/`:
  * `models/schedule_delay/production_model.pkl` (Logistic Regression pipeline)
  * `models/cost_overrun/production_model.pkl` (Random Forest ensemble pipeline)
  * `models/anomaly_detector/production_anomaly_detector.pkl` (IsolationForest sentinel)

### C. Backend API Gateway & Caching
Built with FastAPI, using [`backend/app/repositories/project_repository.py`](file:///c:/Users/varsh/OneDrive/Documents/AI-Powered-Predictive-Analytics-Early-Warning-System-for-Infrastructure-Projects/backend/app/repositories/project_repository.py) to index and cache:
* All 3,531 unique projects for sub-millisecond filtering.
* All 17,697 monthly historical time-series observation rows.
* Pre-computed model inference predictions across all active projects.
* Normalized state, sector, and CPSE agency distributions.

### D. Frontend Dashboard Architecture
The frontend in [`frontend/`](file:///c:/Users/varsh/OneDrive/Documents/AI-Powered-Predictive-Analytics-Early-Warning-System-for-Infrastructure-Projects/frontend) is built with Next.js 14 App Router:
* **Server-Side Rendering (SSR):** Next.js routes dynamically pre-render on initial load while hydrating client-side interactive React components.
* **SVG TopoJSON Map:** Interactive India map in [`frontend/components/dashboard/IndiaMapInteractive.tsx`](file:///c:/Users/varsh/OneDrive/Documents/AI-Powered-Predictive-Analytics-Early-Warning-System-for-Infrastructure-Projects/frontend/components/dashboard/IndiaMapInteractive.tsx) rendering state-level risk choropleths based on live metrics.
* **State Management:** Zustand stores manage auth tokens (`authStore.ts`) and global application state (`appStore.ts`).

---

## 4. Deployment Status: Implemented vs. Planned
 
| Layer / Component | Technology | Implementation Status | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Local Orchestration** | Docker Compose | **COMPLETED & VERIFIED** | Multi-container stack up and healthy on ports 8000 and 3000. |
| **CI/CD Pipeline** | GitHub Actions | **COMPLETED & VERIFIED** | Automated CI workflow passes all backend & frontend checks. |
| **Data Versioning** | DVC (Data Version Control) | **COMPLETED & VERIFIED** | 10-stage DAG locked in `dvc.lock` and `dvc.yaml`. |
| **Experiment Tracking** | MLflow | **COMPLETED & VERIFIED** | Tracked in `mlruns/` and `reports/mlops_registry_catalog.json`. |
| **Amazon ECR & ALB** | AWS ECR, ALB, Target Groups | **COMPLETED & VERIFIED** | ECR repos, ALB, and Target Groups provisioned in `ap-south-1`. |
| **Amazon ECS Services** | ECS Fargate Services | **CONFIGURED BUT NOT VERIFIED** | Task definitions & service automation configured in two-phase pipeline. |
| **Cloud Domain & TLS** | Amazon Route 53, ACM | **PLANNED** | Production SSL domain mapping planned for ministry release. |
