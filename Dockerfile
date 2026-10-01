# ==============================================================================
# Multi-stage Production Dockerfile for GuardianAI
# Stage 1: Build the React + Vite Frontend
# Stage 2: Fast lightweight Python 3.11 image serving both Backend & Frontend
# ==============================================================================

# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.11-slim AS runner

WORKDIR /app

# Prevent Python from writing .pyc and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    GUARDIAN_HOST=0.0.0.0

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source, scripts, demo data, and shared modules
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY demo_agent/ ./demo_agent/
COPY shared/ ./shared/
COPY guardian_sdk/ ./guardian_sdk/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Initialize database schema and generate demonstration PDFs
RUN python scripts/seed_db.py && python scripts/generate_pdfs.py

# Expose port (default 8000, dynamically overridden by $PORT on Render/Railway)
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Start Uvicorn bound to 0.0.0.0 and dynamic $PORT
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
