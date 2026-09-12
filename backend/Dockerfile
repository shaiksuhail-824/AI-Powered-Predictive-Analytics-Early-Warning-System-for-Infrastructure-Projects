# ==============================================================================
# MoSPI PAIMANA Early-Warning & Predictive Analytics Platform (SIH26103)
# Production Dockerfile for FastAPI Backend Service
# ==============================================================================

FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered stdout/stderr logging
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    HOST=0.0.0.0 \
    PORT=8000

WORKDIR /app

# Install minimal OS dependencies required for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pinned production Python packages
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy FastAPI backend application code
COPY backend/ /app/backend/

# Copy ML inference pipeline code
COPY src/ /app/src/

# Copy configuration files
COPY configs/ /app/configs/

# Copy authoritative MoSPI PAIMANA data assets required for runtime serving
COPY data/processed/ /app/data/processed/
COPY data/raw/ /app/data/raw/
COPY data/features/ /app/data/features/

# Copy existing trained ML model artifacts (Schedule Delay, Cost Overrun, Anomaly Sentinel)
COPY models/ /app/models/

# Expose backend API port
EXPOSE 8000

# Container healthcheck using existing FastAPI health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Start FastAPI production server via Uvicorn ASGI
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
