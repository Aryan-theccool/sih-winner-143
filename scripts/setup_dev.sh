#!/usr/bin/env bash
# OriginTrace dev bootstrap: env -> pipeline -> servers
#   bash scripts/setup_dev.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PY=${PY:-python3}
if [ ! -x /home/user/sihenv/bin/python ]; then
  $PY -m venv /home/user/sihenv
  /home/user/sihenv/bin/pip install --quiet --upgrade pip
  /home/user/sihenv/bin/pip install --quiet -r requirements.txt
fi

# compute outputs only if missing (case files are committed; pipeline is deterministic)
if [ ! -f casefiles/KERALA_2025_CASE01/outputs/evidence/evidence.pdf ]; then
  /home/user/sihenv/bin/python -m pipeline.run_all
fi

if [ ! -d frontend/node_modules ]; then
  (cd frontend && npm install --no-audit --no-fund)
fi
if [ ! -d frontend/dist ]; then
  (cd frontend && npm run build)
fi

echo "== start API+UI on :8000 (prod build) — ctrl-C to stop =="
exec /home/user/sihenv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
