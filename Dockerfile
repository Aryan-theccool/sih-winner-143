# ------------------------------------------------------------------
# OriginTrace all-in-one: frontend build + pipeline compute + API
#   docker compose up --build   ->  http://localhost:8000
# Runs FULLY OFFLINE at runtime (everything precomputed into image).
# ------------------------------------------------------------------

# ---- stage 1: frontend build ----
FROM node:22-slim AS fe
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- stage 2: python app ----
FROM python:3.11-slim AS app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY common ./common
COPY casegen ./casegen
COPY ml ./ml
COPY drift ./drift
COPY ranking ./ranking
COPY evidence ./evidence
COPY backend ./backend
COPY pipeline ./pipeline
COPY casefiles ./casefiles
# deterministic, seeded: regenerating produces identical case data.
RUN python -m pipeline.run_all
COPY --from=fe /fe/dist ./frontend/dist
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
