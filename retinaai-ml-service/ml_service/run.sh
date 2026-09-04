#!/usr/bin/env bash
# RETINAAI inference service — one-command start.
#
#   ./ml_service/run.sh          start the service
#   ./ml_service/run.sh verify   run the pipeline check and exit
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CKPT="${MODEL_CHECKPOINT:-artifacts/dr-model.ckpt}"

if [ ! -f "$CKPT" ]; then
  echo "ERROR: $CKPT not found. Run: git lfs install && git lfs pull" >&2
  exit 1
fi

if head -c 24 "$CKPT" | grep -q "git-lfs"; then
  echo "ERROR: $CKPT is a Git LFS pointer, not the model." >&2
  echo "       Run: git lfs install && git lfs pull" >&2
  exit 1
fi

if [ ! -d .venv ]; then
  echo "Creating virtualenv..."
  python3 -m venv .venv
  ./.venv/bin/pip install --quiet --upgrade pip
  ./.venv/bin/pip install -r ml_service/requirements.txt
fi

if [ "${1:-}" = "verify" ]; then
  exec ./.venv/bin/python scripts/verify_pipeline.py
fi

exec ./.venv/bin/uvicorn ml_service.main:app \
  --host "${ML_HOST:-127.0.0.1}" \
  --port "${ML_PORT:-8001}"
