"""
RETINAAI — Inference service configuration.

Self-contained: this service does not import from the legacy `retinacare`
package, so that package can be deleted without breaking inference.

Every threshold is overridable by environment variable, because the right
values depend on the cameras and the population, and hardcoding them into
a container image makes them unchangeable in the field.
"""
import os

# ml_service/config.py -> ml_service -> repo root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_CHECKPOINT = os.getenv(
    "MODEL_CHECKPOINT", os.path.join(PROJECT_ROOT, "artifacts", "dr-model.ckpt")
)

IMAGE_SIZE = int(os.getenv("MODEL_IMAGE_SIZE", 224))
NUM_CLASSES = 5

# Class index -> label. Order matters: it must match the training label
# encoding in src/dataset.py. Changing it silently remaps every prediction.
DR_LABELS = {
    0: "No DR",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
    4: "Proliferative DR",
}

# Label -> JSON key used by the Node backend and the Mongoose schema.
LABEL_TO_KEY = {
    "No DR": "noDR",
    "Mild": "mild",
    "Moderate": "moderate",
    "Severe": "severe",
    "Proliferative DR": "proliferative",
}

# ── Image quality ───────────────────────────────────────────────────────────
#
# PROVISIONAL AND NOT CLINICALLY VALIDATED. Calibrated against the ten sample
# images in data/sample/, which have no gradability labels. They exist to
# reject obviously unusable captures, not to make a gradability judgement.
#
# The original values (blur 100.0, contrast 30.0) were measured on raw
# full-resolution pixels including the black border and rejected 7 of those 10
# real fundus images as blurry. Metrics are now computed on a fixed 512px
# working copy restricted to the retinal disc, which makes them comparable
# across camera types — but the thresholds still need calibrating against your
# own devices and graders before any deployment.
QUALITY_THRESHOLDS = {
    "blur_threshold": float(os.getenv("QUALITY_BLUR_MIN", 12.0)),
    "brightness_min": float(os.getenv("QUALITY_BRIGHTNESS_MIN", 45)),
    "brightness_max": float(os.getenv("QUALITY_BRIGHTNESS_MAX", 215)),
    "contrast_threshold": float(os.getenv("QUALITY_CONTRAST_MIN", 12.0)),
    "centering_threshold": float(os.getenv("QUALITY_CENTERING_MIN", 0.3)),
    "overall_min": float(os.getenv("QUALITY_OVERALL_MIN", 0.45)),
}

# ── Uncertainty ─────────────────────────────────────────────────────────────
#
# Margin between the top two class probabilities. A 43%/38% split is a
# low-margin prediction no matter how confident the headline label looks.
UNCERTAINTY_THRESHOLDS = {
    "low_margin": float(os.getenv("UNCERTAINTY_LOW_MARGIN", 0.40)),
    "moderate_margin": float(os.getenv("UNCERTAINTY_MODERATE_MARGIN", 0.20)),
    "high_margin": float(os.getenv("UNCERTAINTY_HIGH_MARGIN", 0.10)),
    "borderline_margin": float(os.getenv("UNCERTAINTY_BORDERLINE_MARGIN", 0.15)),
}

# ── Service ─────────────────────────────────────────────────────────────────
HOST = os.getenv("ML_HOST", "127.0.0.1")
PORT = int(os.getenv("ML_PORT", 8001))
MAX_UPLOAD_BYTES = int(os.getenv("ML_MAX_UPLOAD_BYTES", 30 * 1024 * 1024))
