"""
src/mlops/register_model.py - MLflow Model Registry Integration & Staging
Registers validated winning production models into MLflow Model Registry,
attaches governance tags (DATA_STATUS = SYNTHETIC / DEMONSTRATION), and manages lifecycle stages.
"""

import os
import sys

# Ensure repository root is in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Auto-delegate to repository's .venv if invoked by an external/system python
venv_python = os.path.join(REPO_ROOT, ".venv", "Scripts", "python.exe") if os.name == "nt" else os.path.join(REPO_ROOT, ".venv", "bin", "python")
if os.path.exists(venv_python):
    if os.path.abspath(sys.executable).lower() != os.path.abspath(venv_python).lower():
        import subprocess
        res = subprocess.run([venv_python] + sys.argv, cwd=REPO_ROOT)
        sys.exit(res.returncode)

os.environ["MLFLOW_DISABLE_AGENT_HINT"] = "1"

import json
import pickle
import mlflow
from mlflow.tracking import MlflowClient
from datetime import datetime

from src.ml.feature_pipeline import load_config
from src.mlops.model_metadata import DATA_STATUS, DATA_STATUS_WARNING, get_model_card


def register_production_models(config_path: str = "configs/model_params.yaml") -> dict:
    """Register selected models into local MLflow Model Registry."""
    config = load_config(config_path)
    mlflow_uri = config.get("paths", {}).get("mlflow_tracking_uri", "sqlite:///mlflow.db")
    models_dir = config.get("paths", {}).get("models_dir", "models")
    reports_dir = config.get("paths", {}).get("reports_dir", "reports")

    mlflow.set_tracking_uri(mlflow_uri)
    client = MlflowClient(tracking_uri=mlflow_uri)

    models_to_register = [
        {
            "name": "Schedule_Delay_Predictor",
            "path": os.path.join(models_dir, "schedule_delay", "production_model.pkl"),
            "target": "future_schedule_delay",
            "description": "Predicts probability of qualifying schedule delay (>=1 month) in future observation period."
        },
        {
            "name": "Cost_Overrun_Predictor",
            "path": os.path.join(models_dir, "cost_overrun", "production_model.pkl"),
            "target": "future_cost_overrun",
            "description": "Predicts probability of cumulative expenditure exceeding original sanctioned cost."
        },
        {
            "name": "Project_Anomaly_Sentinel",
            "path": os.path.join(models_dir, "anomaly_detector", "production_anomaly_detector.pkl"),
            "target": "unsupervised_anomaly",
            "description": "Unsupervised Isolation Forest detecting multi-attribute spend/progress data discordance."
        }
    ]

    catalog = []

    for item in models_to_register:
        if not os.path.exists(item["path"]):
            print(f"[REGISTRY] Skipping {item['name']}: artifact not found at {item['path']}")
            continue

        with open(item["path"], "rb") as f:
            pkg = pickle.load(f)

        print(f"\n[REGISTRY] Registering {item['name']} into MLflow Registry...")

        # Create or retrieve registered model
        try:
            client.create_registered_model(
                name=item["name"],
                description=f"{item['description']}\n\n{DATA_STATUS_WARNING}",
                tags={
                    "data_status": DATA_STATUS,
                    "problem_statement": "SIH26103",
                    "lifecycle": "PRODUCTION",
                    "registered_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            )
        except Exception:
            # Model already exists in registry
            pass

        # Log run and model artifact in dedicated registration run
        with mlflow.start_run(run_name=f"registry_{item['name']}") as run:
            mlflow.set_tag("registered_model_name", item["name"])
            mlflow.set_tag("data_status", DATA_STATUS)
            mlflow.log_artifact(item["path"], artifact_path="model")

            # Create model version
            model_uri = f"runs:/{run.info.run_id}/model"
            mv = client.create_model_version(
                name=item["name"],
                source=model_uri,
                run_id=run.info.run_id,
                description=item["description"],
                tags={"data_status": DATA_STATUS, "stage": "PRODUCTION"}
            )

            # Assign alias or tag
            try:
                client.set_registered_model_alias(item["name"], "production", mv.version)
            except Exception:
                pass

            card = get_model_card(
                model_name=item["name"],
                target_name=item["target"],
                algorithm=str(pkg.get("model_type", "IsolationForest")),
                metrics=pkg.get("test_metrics", {}),
                features=pkg.get("feature_cols", [])
            )

            catalog.append({
                "registered_model_name": item["name"],
                "version": mv.version,
                "run_id": run.info.run_id,
                "stage": "PRODUCTION",
                "data_status": DATA_STATUS,
                "algorithm": card["algorithm"],
                "features_count": card["features_count"],
                "test_metrics": card["metrics"]
            })

            print(f" -> Successfully registered {item['name']} (version {mv.version}) as PRODUCTION")

    catalog_path = os.path.join(reports_dir, "mlops_registry_catalog.json")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)
    print(f"[REGISTRY] Saved registry catalog to {catalog_path}")

    return {
        "status": "success",
        "registered_count": len(catalog),
        "catalog": catalog
    }


if __name__ == "__main__":
    register_production_models()
