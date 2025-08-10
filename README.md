# L‑Nutra Unified MVP Pipeline

This repository contains a unified pipeline that ties together the different assets from the L‑Nutra AI project into a cohesive minimum viable product (MVP).  It merges the clinical FMD prediction service, the supporting machine‑learning microservice, a simple web client for interacting with the API, and optional playbook/operations integration through Supabase.

## Repository Structure

```
lnutra_unified/
  services/
    api/              # FastAPI backend with validation, prediction and Supabase proxies
    ml/               # Lightweight ML microservice wrapping the trained models (stubbed by default)
  apps/
    web/              # A minimal React client using Vite to exercise the API
  infra/
    render.yaml       # Render blueprint for deploying API, ML and database
  .github/
    workflows/ci.yml  # Basic CI workflow to install and lint services
```

### services/api

The API service exposes three categories of endpoints:

* `GET /health` returns the service status, feature checksum and model version.  The checksum can be pinned in the web client via `NEXT_PUBLIC_FEATURE_CHECKSUM`.
* `POST /v1/validate` validates incoming features against business rules (e.g. age bounds, BMI ranges) and returns `ok: false` with `errors` and `hints` when inputs are invalid.
* `POST /v1/predict` sends validated features to the ML microservice (`services/ml`), scales the outputs by the number of cycles, applies safety thresholds and returns personalized recommendations.  If the `DEV_STUB` environment variable is set, a deterministic stub is used instead of a trained model.
* `GET /v1/playbooks` and `GET /v1/playbooks/{slug}` optionally proxy playbook content from Supabase using the `SUPABASE_URL` and `SUPABASE_API_KEY` environment variables.  This allows the frontend to fetch operational playbooks through the same domain.

### services/ml

This microservice wraps the trained FMD models.  It loads two model artefacts (`GLY_MODEL` and `ANTH_MODEL`) and a preprocessing pipeline (`PREPROC`) from disk if `DEV_STUB=false`, otherwise it returns deterministic predictions for demo purposes.  The service listens on port 9000 and exposes a single `POST /v1/predict` endpoint for computing weight and HbA1c changes.

### apps/web

The web application is built with Vite + React.  It demonstrates how to:

* Capture user inputs for age, sex, weight, BMI, HbA1c, diabetes medications, FMD regimen type, number of cycles and adherence.
* Call `POST /v1/validate` and `POST /v1/predict` via helper functions in `src/lib/api.ts`.
* Render a `RecommendationCard` showing the predicted weight and HbA1c change, risk category and rationale.
* Display a simple list of playbooks and details using the Supabase proxy endpoints (if enabled).

Run the web client locally with:

```bash
cd apps/web
npm install
npm run dev
```

Set `VITE_API_BASE` in `.env` to the base URL of your API service (e.g. `http://localhost:8000`).

### infra/render.yaml

The Render blueprint provisions three services:

1. **ln-api** – A dockerized FastAPI service built from `services/api`.  Set `DEV_STUB` to `true` for deterministic outputs, or provide `GLY_MODEL`, `ANTH_MODEL` and `PREPROC` to enable real predictions.
2. **ln-ml** – A dockerized ML service built from `services/ml`.  Exposes port 9000.
3. **ln-db** – A managed PostgreSQL database.  Use this if you decide to migrate the Supabase schema locally or persist user data.

Environment variables for Supabase integration (`SUPABASE_URL` and `SUPABASE_API_KEY`) can be supplied to the API service via the Render dashboard.

### CI

A simple GitHub Actions workflow is included to install dependencies and run placeholder lint checks for both services on push to the `main` branch.  Extend this with `ruff`, `mypy` or tests as you build out the system.

## Usage

1. **Clone and bootstrap** the repository:
   ```bash
   git clone <your-remote>/lnutra_unified.git
   cd lnutra_unified
   ```
2. **Build and run** the services locally (requires Python 3.11+ and `uv`):
   ```bash
   # Start the API
   cd services/api
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

   # In a separate terminal start the ML stub
   cd services/ml
   uvicorn app.server:app --host 0.0.0.0 --port 9000 --reload
   ```
3. **Launch the web client:**
   ```bash
   cd apps/web
   npm install
   echo "VITE_API_BASE=http://localhost:8000" > .env
   npm run dev
   ```
4. **Deploy to Render** by linking your GitHub repo and selecting the `infra/render.yaml` blueprint.

## Extending

This MVP lays the groundwork for a full‑featured L‑Nutra application:

* Replace the stub predictions with your trained models by setting `DEV_STUB=false` and providing `GLY_MODEL`, `ANTH_MODEL` and `PREPROC` as environment variables or Docker secrets.
* Implement authentication and persistent data storage using `auth` and `profiles` tables from the Supabase schema.  You can migrate the Supabase SQL into your own Postgres instance (see `supabase_schema_full.sql`).
* Flesh out the UI with the rich components provided in `L‑Nutra AI.zip` – e.g. `AIOrchestrator`, `KPIDashboardView`, `EnhancedHomeDashboard` – or continue using Figma/FlutterFlow as your design tooling.  The minimal React client here is intentionally simple.
* Add endpoints for logging biometrics, meal logs, and performing fairness analysis or drift detection using the Supabase tables.

With this unified pipeline in place you can iterate rapidly towards production readiness.