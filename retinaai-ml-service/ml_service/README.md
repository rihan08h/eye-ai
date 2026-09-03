# RETINAAI — ML Inference Service

Stateless HTTP wrapper around the trained diabetic retinopathy model. Owns no
database and no clinical workflow; those live in the Node backend.

```
React (5173) ──▶ Express + MongoDB (8000) ──▶ this service (8001)
                        auth, patients,          model, quality,
                        screenings, referrals    Grad-CAM
```

## Layout

```
ml_service/
  main.py          FastAPI app — /predict, /quality-check, /health, /model-info
  inference.py     orchestration: quality gate -> classify -> uncertainty -> Grad-CAM
  config.py        thresholds and labels, all env-overridable
  engine/
    quality.py         OpenCV quality metrics          (cv2 only)
    classifier.py      trained DRModel wrapper         (torch)
    uncertainty.py     entropy + top-two margin        (stdlib)
    explainability.py  Grad-CAM                        (torch)
  run.sh           one-command start
  requirements.txt

src/               the training package — DRModel lives here, unchanged
artifacts/         dr-model.ckpt (Git LFS)
scripts/verify_pipeline.py
```

This package depends only on `src/`. It does not import from `retinacare/`,
so that legacy package can be deleted without breaking inference.

Engine exports are lazy, so `from ml_service.engine.quality import ...` works
on a machine with no torch installed.

## Setup

The model checkpoint is tracked with Git LFS. Without this step you will get a
133-byte pointer file and the service will refuse to start:

```bash
git lfs install
git lfs pull
ls -lh artifacts/dr-model.ckpt    # must be ~65 MB, not 133 bytes
```

Then, from the repository root:

```bash
./ml_service/run.sh verify     # check every stage, then
./ml_service/run.sh            # start on :8001
```

`run.sh` creates the virtualenv, installs dependencies, refuses to start on an
LFS pointer, and launches uvicorn. Manually, if you prefer:

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r ml_service/requirements.txt
python scripts/verify_pipeline.py
uvicorn ml_service.main:app --host 127.0.0.1 --port 8001
```

Confirm it came up:

```bash
curl http://localhost:8001/health
```

A healthy response reports `"modelLoaded": true` and the model version read
from the checkpoint. If the model failed to load you get HTTP 503 and a
`reason` — the service does not pretend to be healthy.

Binding is `127.0.0.1` on purpose. This service has no authentication because
the Node backend is its only client and is what enforces access control.

## Endpoints

| Method | Path             | Purpose                                        |
|--------|------------------|------------------------------------------------|
| GET    | `/health`        | Liveness + whether the model actually loaded   |
| GET    | `/model-info`    | Version, architecture, capabilities            |
| POST   | `/predict`       | Quality gate → classification → Grad-CAM       |
| POST   | `/quality-check` | Quality metrics only, no inference             |

`GET /docs` gives the interactive OpenAPI page.

## `POST /predict`

Multipart form with a `file` field. Optional `heatmap=false` skips Grad-CAM.

Gradable image:

```json
{
  "status": "ok",
  "prediction": "Moderate",
  "confidence": 0.7834,
  "probabilities": { "noDR": 0.05, "mild": 0.11, "moderate": 0.78, "severe": 0.04, "proliferative": 0.02 },
  "imageQuality": { "status": "good", "score": 0.88, "gradable": true, "issues": [], "metrics": {} },
  "uncertainty": { "level": "LOW", "entropy": 1.02, "margin": 0.67, "reviewRequired": false, "message": "..." },
  "explainability": { "heatmapBase64": "...", "overlayBase64": "...", "attentionScore": 0.42, "method": "grad-cam" },
  "modelVersion": "densenet169-dr5-a3f91c02",
  "processingTimeMs": 812,
  "isMock": false
}
```

Ungradable image — HTTP 200, but no prediction at all:

```json
{
  "status": "ungradable",
  "imageQuality": { "status": "rejected", "score": 0.41, "gradable": false, "issues": ["Image is blurry — hold camera steady"] },
  "prediction": null,
  "confidence": null
}
```

This is deliberate. An image the model cannot read must not yield a confident
severity, so none is computed.

## Error contract

| Status | Meaning                                              |
|--------|------------------------------------------------------|
| 400    | Empty or undecodable file                            |
| 413    | Image over 30 MB                                     |
| 415    | Not an image content type                            |
| 500    | Inference failed — no result produced                |
| 503    | Model not loaded (includes `reason`)                 |

There is no fallback result on any of these. The Node backend converts each
into an error the user sees rather than saving something invented.

## What this service does not do

**No lesion detection.** Nothing here reports microaneurysms, hemorrhages,
exudates, cotton wool spots, or neovascularization, because no lesion
detection or segmentation model is integrated. the deleted `findings.py`
in this repository produces such findings from a hardcoded severity lookup
table; it is not imported here and should not be used.

**Grad-CAM is not a lesion map.** The heatmap shows which image regions
influenced the classification. It does not identify or localise pathology, and
the UI labels it accordingly.

**Model confidence is not clinical certainty.** The `uncertainty` block exists
so a 44%/38% split between Proliferative and Severe is surfaced as needing
review, rather than presented as a 44%-confident diagnosis.
