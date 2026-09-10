"""
src/ml/explain.py - Explainable AI (XAI) Engine with SHAP
Computes TreeExplainer attributions for global feature impact and local project-level predictions.
Enables transparent risk driver retrieval for future FastAPI endpoints and dashboard cards.
"""

import os
import sys

# Ensure repository root is in sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import shap
from typing import Dict, Any, List

from src.ml.feature_pipeline import prepare_features, split_temporal_data, load_config


class ModelExplainer:
    """Wrapper around SHAP TreeExplainer for production models."""

    def __init__(self, model_pkg_path: str):
        if not os.path.exists(model_pkg_path):
            raise FileNotFoundError(f"Model package not found at {model_pkg_path}")
        with open(model_pkg_path, "rb") as f:
            self.pkg = pickle.load(f)

        self.pipeline = self.pkg["pipeline"]
        self.feature_cols = self.pkg["feature_cols"]
        self.target_key = self.pkg.get("target_key", "unknown")
        self.model_type = self.pkg.get("model_type", "unknown")

        # Extract underlying classifier
        classifier = self.pipeline.named_steps["classifier"]
        # Use TreeExplainer for tree models (XGBoost, RandomForest)
        if hasattr(classifier, "feature_importances_"):
            self.explainer = shap.TreeExplainer(classifier)
        else:
            self.explainer = None

    def transform_features(self, X: pd.DataFrame) -> np.ndarray:
        """Apply pre-classifier pipeline steps (imputation, scaling)."""
        X_sub = X[self.feature_cols].copy()
        if "imputer" in self.pipeline.named_steps:
            X_sub = self.pipeline.named_steps["imputer"].transform(X_sub)
        if "scaler" in self.pipeline.named_steps:
            X_sub = self.pipeline.named_steps["scaler"].transform(X_sub)
        return X_sub

    def explain_instance(self, instance_df: pd.DataFrame, top_k: int = 4) -> Dict[str, Any]:
        """
        Explain a single project observation.
        Returns prediction probability, top positive risk drivers, and protective factors.
        """
        X_tf = self.transform_features(instance_df)
        prob = float(self.pipeline.predict_proba(instance_df[self.feature_cols])[:, 1][0])

        if self.explainer is None:
            # Fallback for linear models: use coefficients * scaled feature
            coefs = self.pipeline.named_steps["classifier"].coef_[0]
            shap_vals = (X_tf[0] * coefs)
        else:
            raw_shap = self.explainer.shap_values(X_tf)
            if isinstance(raw_shap, list):
                shap_vals = raw_shap[1][0] if len(raw_shap) > 1 else raw_shap[0][0]
            elif len(raw_shap.shape) == 3:
                shap_vals = raw_shap[0, :, 1]
            elif len(raw_shap.shape) == 2:
                shap_vals = raw_shap[0]
            else:
                shap_vals = raw_shap

        contribs = []
        for feat, val, s_val in zip(self.feature_cols, instance_df[self.feature_cols].iloc[0], shap_vals):
            contribs.append({
                "feature": feat,
                "value": float(val) if not np.isnan(val) else 0.0,
                "impact": float(round(s_val, 4))
            })

        # Sort positive drivers (risk increasing) and negative drivers (protective)
        sorted_drivers = sorted(contribs, key=lambda x: x["impact"], reverse=True)
        top_positive = [d for d in sorted_drivers if d["impact"] > 0][:top_k]
        top_negative = [d for d in sorted(contribs, key=lambda x: x["impact"]) if d["impact"] < 0][:top_k]

        return {
            "prediction_probability": round(prob, 4),
            "top_risk_drivers": top_positive,
            "top_protective_drivers": top_negative,
            "all_feature_impacts": {d["feature"]: d["impact"] for d in contribs}
        }


def generate_global_shap_reports(config_path: str = "configs/model_params.yaml"):
    """Generate global SHAP summary beeswarm and bar charts for winning models."""
    config = load_config(config_path)
    models_dir = config.get("paths", {}).get("models_dir", "models")
    figures_dir = config.get("paths", {}).get("figures_dir", "reports/figures")
    os.makedirs(figures_dir, exist_ok=True)

    df = prepare_features(config.get("paths", {}).get("ml_ready_features"), config_path)
    splits = split_temporal_data(df, config_path)
    test_df = splits["test"]

    prod_models = {
        "schedule_delay": os.path.join(models_dir, "schedule_delay", "production_model.pkl"),
        "cost_overrun": os.path.join(models_dir, "cost_overrun", "production_model.pkl")
    }

    generated_plots = {}

    for target_name, path in prod_models.items():
        if not os.path.exists(path):
            continue
        print(f"[XAI] Generating global SHAP summary for {target_name}...")
        explainer = ModelExplainer(path)
        sample_X = test_df.sample(min(400, len(test_df)), random_state=42)
        X_tf = explainer.transform_features(sample_X)

        if explainer.explainer is not None:
            shap_values = explainer.explainer.shap_values(X_tf)
            if isinstance(shap_values, list) and len(shap_values) > 1:
                vals = shap_values[1]
            elif len(shap_values.shape) == 3:
                vals = shap_values[:, :, 1]
            else:
                vals = shap_values

            plt.figure(figsize=(10, 6))
            shap.summary_plot(vals, sample_X[explainer.feature_cols], show=False, max_display=12)
            plt.title(f"SHAP Global Risk Drivers — {target_name.replace('_', ' ').title()}", fontsize=12)
            plt.tight_layout()
            out_plot = os.path.join(figures_dir, f"shap_summary_{target_name}.png")
            plt.savefig(out_plot, dpi=200, bbox_inches="tight")
            plt.close()
            generated_plots[target_name] = out_plot
            print(f"[XAI] Saved plot: {out_plot}")
        else:
            # Linear model explainer via LinearExplainer or feature coefficients
            try:
                linear_explainer = shap.LinearExplainer(explainer.pipeline.named_steps["classifier"], X_tf)
                vals = linear_explainer.shap_values(X_tf)
                plt.figure(figsize=(10, 6))
                shap.summary_plot(vals, sample_X[explainer.feature_cols], show=False, max_display=12)
                plt.title(f"SHAP Linear Risk Drivers — {target_name.replace('_', ' ').title()}", fontsize=12)
            except Exception:
                # Coefficient plot fallback
                coefs = explainer.pipeline.named_steps["classifier"].coef_[0]
                s_series = pd.Series(coefs, index=explainer.feature_cols).sort_values()
                plt.figure(figsize=(10, 6))
                s_series.plot(kind="barh", color=["salmon" if c > 0 else "skyblue" for c in s_series.values])
                plt.title(f"Standardized Model Coefficients — {target_name.replace('_', ' ').title()}", fontsize=12)
                plt.xlabel("Log-Odds Impact (Positive = Increases Risk)")

            plt.tight_layout()
            out_plot = os.path.join(figures_dir, f"shap_summary_{target_name}.png")
            plt.savefig(out_plot, dpi=200, bbox_inches="tight")
            plt.close()
            generated_plots[target_name] = out_plot
            print(f"[XAI] Saved plot: {out_plot}")

    return generated_plots


if __name__ == "__main__":
    generate_global_shap_reports()
