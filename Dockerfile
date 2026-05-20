# ── PhishGuard API — Dockerfile ──────────────────────────────────────────────
# Multi-stage build: keeps final image lean (~400MB vs ~900MB)

# Stage 1: build dependencies
FROM python:3.11-slim AS builder

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# Stage 2: final runtime image
FROM python:3.11-slim

LABEL maintainer="Anish Malu <anishmalu13@gmail.com>"
LABEL description="PhishGuard — ML-powered phishing URL detection API"

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy app code and model artifacts
COPY app/     ./app/
COPY model/   ./model/

# Create non-root user for security best practice
RUN useradd -m -u 1001 phishguard
USER phishguard

EXPOSE 8000

# Uvicorn with 2 workers — adjust based on your EC2 instance size
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
