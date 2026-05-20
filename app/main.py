"""
PhishGuard API — main.py
FastAPI app that:
  • Loads the trained Random Forest model
  • Exposes /predict  (single URL)
  • Exposes /predict/batch  (up to 100 URLs)
  • Exposes /health  (uptime check)
  • Exposes /metrics (Prometheus-compatible, via prometheus_fastapi_instrumentator)
  • Adds SHAP explanations (top-3 features driving each prediction)
"""

import time
import pickle
import shap
import numpy as np
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

# Local module — same feature extraction used in training
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from features import extract, FEATURE_NAMES

# ── Load model artifacts ──────────────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent.parent / "model"

with open(MODEL_DIR / "model.pkl",  "rb") as f: model  = pickle.load(f)
with open(MODEL_DIR / "scaler.pkl", "rb") as f: scaler = pickle.load(f)

# SHAP explainer (TreeExplainer is fast for Random Forests)
explainer = shap.TreeExplainer(model)

START_TIME = time.time()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "PhishGuard API",
    description = "Detects phishing / malicious URLs using ML + SHAP explainability",
    version     = "1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response schemas ────────────────────────────────────────────────
class URLRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError("URL must not be empty")
        return v.strip()

class BatchRequest(BaseModel):
    urls: List[str]

    @field_validator("urls")
    @classmethod
    def max_batch(cls, v):
        if len(v) > 100:
            raise ValueError("Batch size cannot exceed 100")
        return v

class Explanation(BaseModel):
    feature:   str
    value:     float
    shap_value: float
    direction: str   # "increases_risk" or "decreases_risk"

class PredictionResponse(BaseModel):
    url:          str
    label:        str          # "phishing" | "legitimate"
    risk_score:   float        # 0.0 – 1.0  (probability of phishing)
    risk_level:   str          # "low" | "medium" | "high" | "critical"
    explanation:  List[Explanation]
    latency_ms:   float

# ── Helper: predict one URL ───────────────────────────────────────────────────
def _predict_one(url: str) -> PredictionResponse:
    t0 = time.perf_counter()

    # 1. Extract features
    feat_values = extract(url)                        # list[float], len=25
    feat_arr    = np.array(feat_values).reshape(1, -1)
    feat_scaled = scaler.transform(feat_arr)

    # 2. Model prediction
    prob       = float(model.predict_proba(feat_scaled)[0][1])   # P(phishing)
    label      = "phishing" if prob >= 0.5 else "legitimate"

    # 3. Risk level
    if   prob < 0.30: risk_level = "low"
    elif prob < 0.60: risk_level = "medium"
    elif prob < 0.85: risk_level = "high"
    else:             risk_level = "critical"

    # 4. SHAP explanation — top 3 features
    shap_vals = explainer.shap_values(feat_scaled)
    # shap_vals shape varies by version: list of 2 arrays, or 3D array
    if isinstance(shap_vals, list):
        sv = np.array(shap_vals[1]).flatten()
    elif hasattr(shap_vals, "ndim") and shap_vals.ndim == 3:
        sv = shap_vals[0, :, 1]   # (samples, features, classes) → class 1
    else:
        sv = np.array(shap_vals).flatten()

    top_idx = np.argsort(np.abs(sv))[::-1][:3]
    explanation = [
        Explanation(
            feature    = FEATURE_NAMES[i],
            value      = round(float(feat_values[i]), 4),
            shap_value = round(float(sv[i]), 4),
            direction  = "increases_risk" if sv[i] > 0 else "decreases_risk",
        )
        for i in top_idx
    ]

    latency = round((time.perf_counter() - t0) * 1000, 2)

    return PredictionResponse(
        url        = url,
        label      = label,
        risk_score = round(prob, 4),
        risk_level = risk_level,
        explanation= explanation,
        latency_ms = latency,
    )

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":     "ok",
        "uptime_sec": round(time.time() - START_TIME, 1),
        "model":      "RandomForest-200trees",
        "version":    "1.0.0",
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(req: URLRequest):
    """
    Predict whether a single URL is phishing or legitimate.
    Returns risk score (0-1), risk level, and SHAP-based explanation.
    """
    try:
        return _predict_one(req.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=List[PredictionResponse])
def predict_batch(req: BatchRequest):
    """
    Predict up to 100 URLs at once.
    """
    try:
        return [_predict_one(url) for url in req.urls]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/features")
def feature_info():
    """Returns the 25 feature names used by the model."""
    return {"features": FEATURE_NAMES, "count": len(FEATURE_NAMES)}
