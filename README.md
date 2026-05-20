# PhishGuard API 

A production-grade **ML-powered phishing URL detection service** built with FastAPI, scikit-learn, Docker, and SHAP explainability. Deployed on AWS EC2 with CI/CD via GitHub Actions and real-time monitoring via Prometheus + Grafana.

---

## Live Demo
- **API**: `http://<your-ec2-ip>:8000`
- **Interactive Docs**: `http://<your-ec2-ip>:8000/docs`
- **Grafana Dashboard**: `http://<your-ec2-ip>:3000`

---

## Architecture

```
User / Client
     │
     ▼
FastAPI (port 8000)
  ├── /predict          → single URL prediction
  ├── /predict/batch    → up to 100 URLs
  ├── /health           → uptime check
  └── /metrics          → Prometheus scrape endpoint
     │
     ├── RandomForest model (200 trees, 25 features)
     ├── StandardScaler
     └── SHAP TreeExplainer (top-3 feature explanations)

Monitoring Stack:
  Prometheus (port 9090) ──scrapes──▶ FastAPI /metrics
  Grafana    (port 3000) ──reads───▶ Prometheus
```

---

## Features

| Feature | Detail |
|---|---|
| **Model** | Random Forest (200 trees, 12 max depth) |
| **Features** | 25 lexical + structural URL features |
| **Accuracy** | 93% on held-out test set |
| **Explainability** | SHAP values — top 3 features per prediction |
| **API** | FastAPI with Pydantic validation |
| **Containerized** | Docker multi-stage build |
| **Monitoring** | Prometheus metrics + Grafana dashboard |
| **CI/CD** | GitHub Actions — test → build → deploy on push to main |

---

## API Reference

### `POST /predict`

```json
// Request
{ "url": "http://secure-paypal-login.xyz/verify?id=123" }

// Response
{
  "url": "http://secure-paypal-login.xyz/verify?id=123",
  "label": "phishing",
  "risk_score": 0.94,
  "risk_level": "critical",
  "explanation": [
    { "feature": "has_suspicious_word", "value": 1.0, "shap_value": 0.312, "direction": "increases_risk" },
    { "feature": "url_length",          "value": 47.0, "shap_value": 0.201, "direction": "increases_risk" },
    { "feature": "has_https",           "value": 0.0, "shap_value": 0.189, "direction": "increases_risk" }
  ],
  "latency_ms": 18.4
}
```

### `POST /predict/batch`
Send up to 100 URLs at once. Returns an array of prediction objects.

### `GET /health`
Returns API status, uptime, and model version.

---

## Run Locally

### Option 1 — Docker Compose (recommended, runs everything)

```bash
# 1. Clone the repo
git clone https://github.com/malubhai13/phishguard-api
cd phishguard-api

# 2. Train the model
python model/train.py

# 3. Start all services (API + Prometheus + Grafana)
docker compose up --build

# 4. Open
#    API docs   → http://localhost:8000/docs
#    Grafana    → http://localhost:3000  (admin/admin)
#    Prometheus → http://localhost:9090
```

### Option 2 — Python directly

```bash
pip install -r requirements.txt
python model/train.py
uvicorn app.main:app --reload --port 8000
```

---

## Project Structure

```
phishguard/
├── app/
│   ├── main.py          # FastAPI app — routes, prediction logic
│   └── features.py      # 25 URL feature extraction functions
├── model/
│   ├── train.py         # Training script
│   ├── model.pkl        # Trained Random Forest (git-ignored, built by CI)
│   ├── scaler.pkl       # StandardScaler
│   └── feature_names.pkl
├── monitoring/
│   ├── prometheus.yml   # Prometheus scrape config
│   └── grafana_dashboard.json
├── tests/
│   └── test_api.py      # 8 pytest tests
├── .github/workflows/
│   └── deploy.yml       # CI/CD: test → build → push Docker → deploy EC2
├── Dockerfile           # Multi-stage build
├── docker-compose.yml   # API + Prometheus + Grafana
└── requirements.txt
```

---

## CI/CD Pipeline

```
git push main
     │
     ▼
GitHub Actions
  ├── [1] Run pytest (8 tests)
  ├── [2] Build Docker image → push to Docker Hub
  └── [3] SSH into EC2 → docker compose pull → restart
```

**Secrets needed** (GitHub → Settings → Secrets):
- `DOCKER_USERNAME` / `DOCKER_PASSWORD`
- `EC2_HOST` / `EC2_SSH_KEY`

---

## Deploy to AWS EC2

```bash
# On your EC2 instance (Ubuntu 22.04, t2.micro free tier)
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu

git clone https://github.com/malubhai13/phishguard-api
cd phishguard-api
python model/train.py   # or let CI/CD handle this
docker compose up -d
```

---

## Tech Stack

`Python` · `FastAPI` · `scikit-learn` · `SHAP` · `Docker` · `AWS EC2` · `GitHub Actions` · `Prometheus` · `Grafana` · `pytest`

---

## Author
**Anish Malu** — [LinkedIn](https://linkedin.com/in/anish-malu13) · [GitHub](https://github.com/malubhai13)

*AIR 67 — Amazon ML Challenge 2025*
