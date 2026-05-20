"""
tests/test_api.py
Run with: pytest tests/ -v
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ── Health check ──────────────────────────────────────────────────────────────
def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "uptime_sec" in data


# ── Single prediction — known phishing URL ────────────────────────────────────
def test_predict_phishing():
    r = client.post("/predict", json={
        "url": "http://secure-paypal-login.xyz/account/verify?id=12345"
    })
    assert r.status_code == 200
    data = r.json()
    assert data["label"] == "phishing"
    assert data["risk_score"] >= 0.5
    assert len(data["explanation"]) == 3
    assert data["risk_level"] in ["medium", "high", "critical"]


# ── Single prediction — known legitimate URL ──────────────────────────────────
def test_predict_legitimate():
    r = client.post("/predict", json={"url": "https://www.google.com/search?q=python"})
    assert r.status_code == 200
    data = r.json()
    assert data["label"] == "legitimate"
    assert data["risk_score"] < 0.5


# ── Explanation structure ─────────────────────────────────────────────────────
def test_explanation_fields():
    r = client.post("/predict", json={
        "url": "http://192.168.1.1/banking/signin.php?user=update"
    })
    assert r.status_code == 200
    for ex in r.json()["explanation"]:
        assert "feature"    in ex
        assert "value"      in ex
        assert "shap_value" in ex
        assert ex["direction"] in ["increases_risk", "decreases_risk"]


# ── Batch prediction ──────────────────────────────────────────────────────────
def test_batch_predict():
    r = client.post("/predict/batch", json={"urls": [
        "https://github.com/scikit-learn",
        "http://paypa1.secure-update.info/password/reset",
        "https://docs.python.org",
    ]})
    assert r.status_code == 200
    results = r.json()
    assert len(results) == 3


# ── Batch size limit ──────────────────────────────────────────────────────────
def test_batch_limit():
    r = client.post("/predict/batch", json={"urls": ["https://x.com"] * 101})
    assert r.status_code == 422   # Validation error


# ── Empty URL rejected ────────────────────────────────────────────────────────
def test_empty_url_rejected():
    r = client.post("/predict", json={"url": "   "})
    assert r.status_code == 422


# ── Feature list endpoint ─────────────────────────────────────────────────────
def test_feature_info():
    r = client.get("/features")
    assert r.status_code == 200
    assert r.json()["count"] == 25
