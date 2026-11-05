# ============================================================
# BIODIVERSITY INTELLIGENCE AI — PRODUCTION DOCKERFILE
# ============================================================

FROM python:3.11-slim

# Set environment flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies (build-essential, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency list and install
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY app/ ./app/
COPY frontend/ ./frontend/
COPY chroma_db/ ./chroma_db/
COPY data/ ./data/

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose web port
EXPOSE 8000

# Start unified FastAPI server (serves both 3D frontend & RAG API)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}

