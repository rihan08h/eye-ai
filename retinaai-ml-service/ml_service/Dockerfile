# RETINAAI inference service.
#
# Build from the REPOSITORY ROOT, not from ml_service/:
#   docker build -f ml_service/Dockerfile -t retinaai-ml .
#
# src/ is required (DRModel lives there) and artifacts/dr-model.ckpt must be
# the real 67 MB file — run `git lfs pull` before building.
FROM python:3.11-slim

# opencv-python-headless still needs libgl/libglib at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first so a code change doesn't reinstall torch.
COPY ml_service/requirements.txt ./ml_service/requirements.txt
RUN pip install --no-cache-dir -r ml_service/requirements.txt

COPY src/ ./src/
COPY ml_service/ ./ml_service/
COPY artifacts/dr-model.ckpt ./artifacts/dr-model.ckpt

# Fail the build rather than shipping an image that will 503 on every request.
RUN python -c "\
import os,sys; p='artifacts/dr-model.ckpt'; s=os.path.getsize(p);\
sys.exit('BUILD FAILED: %s is a %d-byte Git LFS pointer. Run: git lfs pull' % (p,s)) if s < 1_000_000 else None"

RUN useradd --create-home --uid 10001 retinaai && chown -R retinaai /app
USER retinaai

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

EXPOSE 8001

# The model must be loaded, not merely the process alive — /health returns 503
# until it is, so an orchestrator won't route traffic to a broken replica.
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD curl -fsS http://localhost:8001/health || exit 1

# One uvicorn worker on purpose. Inference is serialised behind a single
# thread anyway (see ml_service/execution.py), and multiple workers would each
# load a full copy of the model into memory. Scale with replicas.
CMD ["uvicorn", "ml_service.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"]
