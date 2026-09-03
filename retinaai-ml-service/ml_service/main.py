"""
RETINAAI — ML Inference Service

A stateless HTTP wrapper around the trained DR model. It owns no database,
no patients, and no clinical workflow — those belong to the Node backend.
This service takes an image and returns what the model actually saw.

Run:
    uvicorn ml_service.main:app --host 127.0.0.1 --port 8001

Port 8001 is deliberate: the Node backend binds 8000 and expects the model
service at ML_API_URL (default http://localhost:8001).

Bind to 127.0.0.1, not 0.0.0.0. This service has no authentication because
it is not meant to be reachable from outside the host — the Node backend is
the only client, and it is what enforces auth. Exposing this publicly would
put an unauthenticated inference endpoint on the internet.
"""
import io
import logging

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

from ml_service.inference import InferenceEngine, ModelNotLoadedError
from ml_service.execution import run_inference, metrics, shutdown as drain_executor, ServiceBusyError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ml_service")

from ml_service.config import MAX_UPLOAD_BYTES  # matches the Express body limit
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp", "image/tiff"}

app = FastAPI(
    title="RETINAAI Inference Service",
    description=(
        "Diabetic retinopathy classification, image quality assessment, and "
        "Grad-CAM explainability. AI-assisted screening support — not a "
        "clinical diagnosis."
    ),
    version="1.0.0",
)

# Set at startup. Stays None if the model could not load, which makes
# /health report unhealthy instead of claiming everything is fine.
_engine = None
_load_error = None


@app.on_event("startup")
def load_model() -> None:
    global _engine, _load_error
    try:
        _engine = InferenceEngine.get_instance()
        logger.info("Model loaded: %s", _engine.model_version)

        # Warm up with a synthetic tensor. cuDNN algorithm selection and lazy
        # CUDA/MKL initialisation happen on the first forward pass, which can
        # add seconds — better paid at startup than by the first patient.
        try:
            _engine.warmup()
            logger.info("Warmup complete")
        except Exception as exc:
            logger.warning("Warmup failed (service still usable): %s", exc)
    except ModelNotLoadedError as exc:
        _load_error = str(exc)
        logger.error("MODEL NOT LOADED — %s", exc)
    except Exception as exc:
        _load_error = f"{type(exc).__name__}: {exc}"
        logger.error("MODEL NOT LOADED — %s", exc, exc_info=True)


def _require_engine() -> InferenceEngine:
    if _engine is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "model_unavailable",
                "message": (
                    "The DR model is not loaded, so no analysis can be performed."
                ),
                "reason": _load_error or "unknown",
            },
        )
    return _engine


async def _read_image(file: UploadFile):
    """Decode an upload into (PIL RGB image, OpenCV BGR array)."""
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail={
                "error": "unsupported_media_type",
                "message": f"Expected a retinal image, received {file.content_type}.",
            },
        )

    raw = await file.read()

    if not raw:
        raise HTTPException(
            status_code=400,
            detail={"error": "empty_file", "message": "The uploaded file is empty."},
        )

    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "file_too_large",
                "message": f"Image exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit.",
            },
        )

    try:
        pil_image = Image.open(io.BytesIO(raw)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_image",
                "message": "The file could not be decoded as an image.",
            },
        )

    rgb = np.array(pil_image)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    return pil_image, bgr


@app.on_event("shutdown")
def on_shutdown() -> None:
    drain_executor()


@app.get("/health")
def health():
    """
    Honest health check.

    Reports 503 when the model is missing. The previous FastAPI app returned
    a hardcoded "model_loaded": true regardless of startup outcome, which made
    a broken deployment look healthy to anything monitoring it.
    """
    if _engine is None:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "retinaai-ml",
                "modelLoaded": False,
                "reason": _load_error or "unknown",
            },
        )

    return {
        "status": "healthy",
        "service": "retinaai-ml",
        "modelLoaded": True,
        "modelVersion": _engine.model_version,
        "architecture": _engine.architecture,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...), heatmap: bool = True):
    """
    Full analysis: quality gate -> classification -> uncertainty -> Grad-CAM.

    An ungradable image returns HTTP 200 with status "ungradable" and no
    prediction. That is a successful assessment with a clinical answer of
    "recapture the image", not an error.
    """

    logger.info("========== PREDICTION REQUEST RECEIVED ==========")
    logger.info("Filename: %s", file.filename)
    logger.info("Content type: %s", file.content_type)
    logger.info("Heatmap requested: %s", heatmap)

    # STEP 1: Get inference engine
    logger.info("STEP 1: Getting inference engine")
    engine = _require_engine()
    logger.info("STEP 1 COMPLETE: Inference engine ready")

    try:
        # STEP 2: Read and decode image
        logger.info("STEP 2: Starting image read and decode")

        pil_image, bgr = await _read_image(file)

        logger.info("STEP 2 COMPLETE: Image successfully decoded")
        logger.info("PIL image size: %s", pil_image.size)
        logger.info("OpenCV image shape: %s", bgr.shape)

        # STEP 3: Start inference
        logger.info("STEP 3: Starting model analysis")

        result = await run_inference(
            lambda: engine.analyze(
                pil_image,
                bgr,
                want_heatmap=heatmap
            )
        )

        logger.info("STEP 3 COMPLETE: Model analysis finished")
        logger.info("========== RETURNING PREDICTION RESPONSE ==========")

        return result

    except ServiceBusyError as exc:

        logger.warning(
            "SERVICE BUSY: %s",
            exc
        )

        raise HTTPException(
            status_code=503,
            headers={"Retry-After": "5"},
            detail={
                "error": "service_busy",
                "message": (
                    "The model is at capacity. "
                    "No analysis was performed — please retry."
                ),
                "reason": str(exc),
            },
        )

    except Exception as exc:

        logger.error(
            "INFERENCE FAILED: %s",
            exc,
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail={
                "error": "inference_failed",
                "message": (
                    "Analysis could not be completed. "
                    "No result was produced."
                ),
            },
        )

@app.post("/quality-check")
async def quality_check(file: UploadFile = File(...)):
    """
    Quality assessment only — no classification, no model inference.

    Useful for giving a capture operator immediate feedback before committing
    to a full screening.
    """
    engine = _require_engine()
    _, bgr = await _read_image(file)

    try:
        return await run_inference(lambda: {"imageQuality": engine.assess_quality(bgr)})
    except ServiceBusyError:
        raise HTTPException(
            status_code=503,
            headers={"Retry-After": "5"},
            detail={"error": "service_busy", "message": "At capacity — please retry."},
        )
    except Exception as exc:
        logger.error("Quality check failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "quality_check_failed",
                "message": "Image quality could not be assessed.",
            },
        )


@app.get("/model-info")
def model_info():
    """Model metadata for the AI operations page (Module 23)."""
    engine = _require_engine()
    return {
        "modelVersion": engine.model_version,
        "architecture": engine.architecture,
        "classes": ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"],
        "inputSize": 224,
        "checkpointPath": engine.checkpoint_path,
        "capabilities": {
            "classification": True,
            "imageQuality": True,
            "gradCam": True,
            "uncertainty": True,
            "lesionDetection": False,
        },
        "lesionDetectionNote": (
            "No lesion detection or segmentation model is integrated. "
            "This service does not report microaneurysms, hemorrhages, "
            "exudates, or cotton wool spots."
        ),
    }


@app.get("/metrics")
def runtime_metrics():
    """
    Operational counters for the AI monitoring view (Module 23).

    Reports what this process has observed since start: request volume, error
    rate, latency percentiles, prediction distribution, and the most common
    image-quality issues. These are NOT model performance metrics — accuracy,
    sensitivity and specificity cannot be computed without labelled ground
    truth, which this service does not have.
    """
    snapshot = metrics.snapshot()
    snapshot["modelVersion"] = _engine.model_version if _engine else None
    snapshot["modelLoaded"] = _engine is not None
    return snapshot
