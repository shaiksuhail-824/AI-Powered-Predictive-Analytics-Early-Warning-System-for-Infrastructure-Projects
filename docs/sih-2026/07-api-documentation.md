# Backend API Documentation — MoSPI PAIMANA

**Smart India Hackathon 2026 | Problem Statement SIH26103**  
**Framework:** FastAPI (Python 3.12, Uvicorn ASGI)  
**API Specification:** OpenAPI 3.0 / Swagger UI at `/api/v1/docs`  
**Base URL:** `http://localhost:8000/api/v1` (Local / Docker)  

---

## 1. Authentication & Security Overview

The API implements zero-trust **JSON Web Token (JWT)** Bearer authentication signed with **HS256**. Protected endpoints require the HTTP Authorization header:
```http
Authorization: Bearer <jwt_access_token>
```

### Role-Based Access Control (RBAC) Permissions Matrix
The system enforces three authenticated roles:
1. `ADMIN`: Full access to all portfolio, national oversight, simulation, and user administrative endpoints.
2. `MINISTRY_PROJECT_HEAD`: Sectoral oversight across projects within designated administrative ministries.
3. `AGENCY_CONTRACTOR`: Scoped access automatically filtered to projects implemented by their assigned CPSE (e.g. NHAI, RVNL, NTPC). Cannot execute portfolio-wide administrative overrides.

---

## 2. API Endpoints Catalog

### Summary Table of All Endpoints

| Category | HTTP Method | Route | Description | Auth Required |
| :--- | :---: | :--- | :--- | :---: |
| **System** | `GET` | `/` | Root service status and documentation links | None |
| **System** | `GET` | `/api/v1/health` | Service and ML model health check | None |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT bearer token | None |
| **Auth** | `GET` | `/api/v1/auth/me` | Retrieve profile of authenticated user | Bearer Token |
| **Projects** | `GET` | `/api/v1/projects` | Paginated project catalog with filters | Bearer Token |
| **Projects** | `GET` | `/api/v1/projects/{project_code}` | Full project specification and risk signals | Bearer Token |
| **Projects** | `GET` | `/api/v1/projects/{project_code}/history` | Longitudinal monthly observations | Bearer Token |
| **Inference** | `POST` | `/api/v1/predict` | Real-time project scenario ML simulation | Bearer Token |
| **Risk** | `GET` | `/api/v1/projects/{project_code}/risk` | Project-specific risk drivers & SHAP values | Bearer Token |
| **Risk** | `GET` | `/api/v1/risk/summary` | Portfolio-wide risk breakdown & trajectories | Bearer Token |
| **States** | `GET` | `/api/v1/states` | Geographic summary for all Indian States & UTs | Bearer Token |
| **States** | `GET` | `/api/v1/states/{state_name}` | State project portfolio & CPSE breakdown | Bearer Token |
| **Dashboard** | `GET` | `/api/v1/dashboard/overview` | Executive national monitoring summary metrics | Bearer Token |
| **Alerts** | `GET` | `/api/v1/alerts` | Filter early warning escalation alerts | Bearer Token |
| **Benchmarking**| `GET` | `/api/v1/benchmarking` | Compare project against state/agency/portfolio | Bearer Token |

---

## 3. Detailed Endpoint Specifications

### A. Health & Discovery Endpoints

#### `GET /api/v1/health`
Checks backend responsiveness, in-memory repository readiness, and production ML model availability.
* **Authentication:** None
* **Success Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "data_loaded": true,
  "total_projects": 3531,
  "total_observations": 17697,
  "models_loaded": true,
  "data_status": "SYNTHETIC / DEMONSTRATION",
  "timestamp": "2026-09-13T10:00:00.000Z"
}
```

---

### B. Authentication Endpoints

#### `POST /api/v1/auth/login`
Authenticates user credentials and issues a scoped JWT access token.
* **Request Body:**
```json
{
  "username": "admin01",
  "password": "password123"
}
```
* **Success Response (HTTP 200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 43200,
  "user": {
    "username": "admin01",
    "name": "Dr. A. K. Sharma",
    "email": "admin01@mospi.gov.in",
    "role": "ADMIN",
    "organization": "MoSPI IPMD",
    "scoped_agency": null
  }
}
```
* **Error Response (HTTP 401 Unauthorized):**
```json
{
  "detail": "Invalid username or password"
}
```

#### `GET /api/v1/auth/me`
Returns the authenticated identity and permission scope of the caller.

---

### C. Projects Endpoints

#### `GET /api/v1/projects`
Retrieves a paginated list of central infrastructure projects with multi-criteria filtering.
* **Query Parameters:**
  * `page` (*int*, default 1): Page number ($\ge 1$).
  * `page_size` (*int*, default 20): Items per page ($\le 100$).
  * `state` (*string*, optional): Filter by canonical State name (e.g. `Maharashtra`, `Odisha`).
  * `risk_level` (*string*, optional): Filter by risk tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  * `delayed_only` (*boolean*, optional): Filter for projects with recorded time overrun.
  * `search` (*string*, optional): Search project code, title, or CPSE agency.
* **Success Response (HTTP 200 OK):**
```json
{
  "items": [
    {
      "project_code": "060100093",
      "project_name": "Udhampur-Srinagar-Baramulla Rail Link (USBRL)",
      "agency": "Northern Railway",
      "state": "Jammu and Kashmir",
      "ministry": "Ministry of Railways",
      "sector": "Railways",
      "original_cost_cr": 2500.0,
      "cumulative_expenditure_cr": 37250.5,
      "physical_progress_pct": 98.4,
      "status": "Delayed",
      "overall_risk_score": 68.4,
      "risk_level": "HIGH",
      "time_overrun_days": 4380.0,
      "time_overrun_flag": 1,
      "latest_report_date": "2026-04-01"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 3531,
    "total_pages": 177
  }
}
```

#### `GET /api/v1/projects/{project_code}`
Retrieves complete operational attributes, financial revisions, slippage gaps, and model risk signals.
* **Path Parameter:** `project_code` (*string*).

#### `GET /api/v1/projects/{project_code}/history`
Returns chronological monthly progress records for trend analysis.

---

### D. Real-Time Scenario Simulation & Prediction

#### `POST /api/v1/predict`
Executes real-time inference across all three production ML models (Schedule, Cost, Anomaly) and computes local SHAP feature attributions.
* **Request Body:**
```json
{
  "project_code": "SIM_PROJECT_01",
  "original_cost_cr": 1200.0,
  "cumulative_expenditure_cr": 850.0,
  "physical_progress_pct": 52.0,
  "planned_duration_days": 1095.0,
  "elapsed_duration_days": 850.0,
  "approval_to_start_days": 120.0,
  "agency_frequency": 0.05,
  "state_frequency": 0.03
}
```
* **Success Response (HTTP 200 OK):**
```json
{
  "project_code": "SIM_PROJECT_01",
  "prediction_timestamp": "2026-09-13T10:05:00.000Z",
  "schedule_delay_probability": 0.842,
  "cost_overrun_probability": 0.718,
  "overall_risk_score": 78.5,
  "risk_level": "CRITICAL",
  "risk_trajectory": "RAPID_ESCALATION",
  "risk_delta": 6.2,
  "anomaly_status": "NORMAL",
  "intervention_priority": "CRITICAL",
  "top_risk_drivers": [
    {
      "feature": "schedule_progress_gap_pct",
      "impact": 0.425,
      "value": -25.6
    },
    {
      "feature": "expenditure_per_progress_pct_cr",
      "impact": 0.281,
      "value": 16.34
    }
  ],
  "data_status": "SYNTHETIC / DEMONSTRATION"
}
```

---

### E. Risk Analytics & Early Warning Endpoints

#### `GET /api/v1/dashboard/overview`
Provides high-level national metrics for the executive overview:
* Total active projects, delayed count, high/critical risk counts, portfolio risk distribution, state summaries, recent alerts, and longitudinal risk trends.

#### `GET /api/v1/alerts`
Returns automated early-warning alerts generated for critical projects.
* **Query Parameters:** `severity` (`Medium`, `High`, `Critical`), `limit` (*int*).

#### `GET /api/v1/benchmarking?project_code={project_code}`
Compares a project's physical progress and risk score against:
1. State peers in the same geographic region.
2. Sector peers managed by the same CPSE.
3. The entire national central sector portfolio.
