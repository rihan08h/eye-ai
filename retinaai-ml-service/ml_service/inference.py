"""
RETINAAI — Inference Engine

Thin orchestration layer over ml_service/engine/:
    quality.py         OpenCV quality metrics
    classifier.py      DRModel wrapper (src/model.py)
    explainability.py  Grad-CAM
    uncertainty.py     entropy + top-two margin

Deliberately NOT used:
    retinacare/engine/findings.py  — fabricates lesion detection from a
        hardcoded severity->lesion lookup table. No lesion model exists,
        so no lesion findings are produced by this service.
    retinacare/engine/risk.py      — risk/triage is owned by the Node
        backend (backend/config/riskConfig.js). Keeping one source of
        truth avoids two divergent triage systems.

Failure policy: this module NEVER invents a result. If the model cannot
load or inference fails, it raises. The caller returns an error to the
client. A screening that did not happen must not look like one that did.
"""
import os
import sys
import time
import logging
from typing import Optional

import numpy as np

# Make the repo root importable so `src` (the training package) resolves.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

logger = logging.getLogger(__name__)



from ml_service.config import LABEL_TO_KEY, MODEL_CHECKPOINT  # noqa: E402


class ModelNotLoadedError(RuntimeError):
    """Raised when the checkpoint is absent, truncated, or unreadable."""


def _assert_checkpoint_is_real(path: str) -> None:
    """
    Guard against the Git LFS pointer file.

    `artifacts/dr-model.ckpt` is tracked by LFS. Without `git lfs pull` it is
    a ~133 byte text pointer, and torch will fail with an opaque unpickling
    error. Detect it here and say what to actually do about it.
    """
    if not os.path.exists(path):
        raise ModelNotLoadedError(
            f"Checkpoint not found at {path}. "
            "Run `git lfs install && git lfs pull` in the repository root."
        )

    size = os.path.getsize(path)
    if size < 1_000_000:  # real checkpoint is ~67 MB
        try:
            with open(path, "rb") as f:
                head = f.read(64)
        except OSError:
            head = b""

        if head.startswith(b"version https://git-lfs"):
            raise ModelNotLoadedError(
                f"{path} is a Git LFS pointer ({size} bytes), not the model. "
                "Run `git lfs install && git lfs pull` to download the real "
                "67 MB checkpoint."
            )

        raise ModelNotLoadedError(
            f"{path} is only {size} bytes — too small to be a valid checkpoint."
        )


def _read_model_name_from_checkpoint(path: str) -> Optional[str]:
    """
    Read the architecture name out of the checkpoint's saved hyperparameters.

    The old code hardcoded 'v1.0-resnet50-gradcam' in mlService.js and
    'retina-v1.0-densenet169' in retinacare/config.py. Both were guesses, and
    at least one was wrong. Reading it from the checkpoint means the recorded
    model version is always the model that actually ran.
    """
    try:
        import torch

        ckpt = torch.load(path, map_location="cpu", weights_only=False)
        hparams = ckpt.get("hyper_parameters", {}) or {}
        return hparams.get("model_name")
    except Exception as exc:  # pragma: no cover - diagnostic path only
        logger.warning("Could not read model_name from checkpoint: %s", exc)
        return None


class InferenceEngine:
    """Loads the model once and serves predictions. Singleton via get_instance()."""

    _instance: Optional["InferenceEngine"] = None

    def __init__(self, checkpoint_path: str = None):
        from ml_service.engine.quality import ImageQualityAssessor
        from ml_service.engine.classifier import DRClassifier
        from ml_service.engine.explainability import GradCAMExplainer
        from ml_service.engine.uncertainty import UncertaintyEngine
        from ml_service.config import QUALITY_THRESHOLDS, UNCERTAINTY_THRESHOLDS

        self.checkpoint_path = checkpoint_path or MODEL_CHECKPOINT
        _assert_checkpoint_is_real(self.checkpoint_path)

        architecture = _read_model_name_from_checkpoint(self.checkpoint_path) or "unknown"
        self.model_version = f"{architecture}-dr5-{self._checkpoint_fingerprint()}"

        logger.info("Loading checkpoint %s (%s)", self.checkpoint_path, architecture)

        self.quality_assessor = ImageQualityAssessor(**QUALITY_THRESHOLDS)
        self.classifier = DRClassifier(
            checkpoint_path=self.checkpoint_path,
            model_version=self.model_version,
        )
        self.explainer = GradCAMExplainer(self.classifier)
        self.uncertainty_engine = UncertaintyEngine(**UNCERTAINTY_THRESHOLDS)

        self.architecture = architecture
        logger.info("Inference engine ready — model_version=%s", self.model_version)

    def _checkpoint_fingerprint(self) -> str:
        """Short content hash so two different checkpoints never share a version string."""
        import hashlib

        h = hashlib.sha256()
        with open(self.checkpoint_path, "rb") as f:
            # Hash the first and last 1 MB — enough to distinguish checkpoints
            # without reading 67 MB on every startup.
            h.update(f.read(1_048_576))
            f.seek(max(0, os.path.getsize(self.checkpoint_path) - 1_048_576))
            h.update(f.read(1_048_576))
        return h.hexdigest()[:8]

    @classmethod
    def get_instance(cls) -> "InferenceEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── Quality only ────────────────────────────────────────────────────────

    def assess_quality(self, image_bgr: np.ndarray) -> dict:
        """Run image quality assessment without classification."""
        result = self.quality_assessor.assess(image_bgr)
        return self._quality_to_dict(result)

    @staticmethod
    def _quality_to_dict(result) -> dict:
        """
        Map QualityResult onto the shape the Node backend stores.

        `status` is derived from the score using the same bands the Mongoose
        enum already allows: good / adequate / poor / rejected.
        """
        score = float(result.overall_score)
        if not result.usable:
            status = "rejected"
        elif score >= 0.85:
            status = "good"
        elif score >= 0.70:
            status = "adequate"
        else:
            status = "poor"

        issues = list(result.feedback or [])

        return {
            "status": status,
            "score": round(score, 4),
            "gradable": bool(result.usable),
            # Heuristic warning only — never blocks a screening.
            "retinaPlausible": bool(getattr(result, "retina_plausible", True)),
            "issues": issues,
            "metrics": {
                "blur": round(float(result.blur_score), 2),
                "blurOk": bool(result.blur_ok),
                "brightness": round(float(result.brightness), 2),
                "brightnessOk": bool(result.brightness_ok),
                "contrast": round(float(result.contrast), 2),
                "contrastOk": bool(result.contrast_ok),
                "centering": round(float(result.centering_score), 4),
                "centeredOk": bool(result.centered_ok),
            },
        }

    def warmup(self) -> None:
        """
        Run one throwaway prediction so the first real request doesn't pay
        lazy-initialisation cost.

        The first forward pass triggers cuDNN algorithm selection, MKL setup
        and CUDA context creation, which can add seconds. Doing it at startup
        means a readiness probe only passes once the model is genuinely ready
        to serve at normal latency.
        """
        import numpy as np
        from PIL import Image

        blank = Image.fromarray(np.zeros((256, 256, 3), dtype=np.uint8))
        bgr = np.zeros((256, 256, 3), dtype=np.uint8)

        # Classification and Grad-CAM are warmed directly rather than through
        # analyze(), because a blank frame fails the quality gate and would
        # short-circuit before ever reaching the model.
        classification = self.classifier.predict(blank)
        try:
            self._explain(blank, classification.predicted_class, bgr)
        except Exception:
            pass  # Grad-CAM warmup is best-effort

    # ── Full analysis ───────────────────────────────────────────────────────

    def analyze(self, pil_image, image_bgr: np.ndarray, want_heatmap: bool = True) -> dict:
        """
        Run the full pipeline.

        Quality is assessed first. If the image is ungradable the pipeline
        STOPS — no classification is returned at all. Module 6 requires that
        an ungradable image never yields a confident clinical result, and the
        cheapest way to guarantee that is to not compute one.
        """
        started = time.perf_counter()

        quality = self.assess_quality(image_bgr)

        if not quality["gradable"]:
            return {
                "status": "ungradable",
                "imageQuality": quality,
                "prediction": None,
                "probabilities": None,
                "confidence": None,
                "uncertainty": None,
                "explainability": None,
                "modelVersion": self.model_version,
                "processingTimeMs": int((time.perf_counter() - started) * 1000),
                "isMock": False,
            }

        classification = self.classifier.predict(pil_image)

        probabilities = {
            LABEL_TO_KEY[label]: round(float(prob), 6)
            for label, prob in classification.all_probabilities.items()
            if label in LABEL_TO_KEY
        }

        uncertainty = self.uncertainty_engine.assess(classification.all_probabilities)

        explainability = None
        if want_heatmap:
            explainability = self._explain(pil_image, classification.predicted_class, image_bgr)

        return {
            "status": "ok",
            "imageQuality": quality,
            "prediction": classification.predicted_label,
            "probabilities": probabilities,
            "confidence": round(float(classification.confidence), 6),
            "uncertainty": {
                "level": uncertainty.level,
                "entropy": round(float(uncertainty.entropy), 4),
                "margin": round(float(uncertainty.margin), 4),
                "isBorderline": bool(uncertainty.is_borderline),
                "reviewRequired": bool(uncertainty.review_required),
                "message": uncertainty.message,
            },
            "explainability": explainability,
            "modelVersion": self.model_version,
            "processingTimeMs": int((time.perf_counter() - started) * 1000),
            "isMock": False,
        }

    def _explain(self, pil_image, predicted_class: int, image_bgr: np.ndarray) -> Optional[dict]:
        """
        Generate Grad-CAM. Returns None on failure rather than raising —
        a missing heatmap degrades the result, it doesn't invalidate the
        classification. The caller renders "unavailable", never a placeholder.
        """
        try:
            explanation = self.explainer.explain(
                image=pil_image,
                predicted_class=predicted_class,
                original_image=image_bgr,
            )

            heatmap_b64 = explanation.get_heatmap_base64()
            overlay_b64 = explanation.get_overlay_base64()

            if not heatmap_b64 and not overlay_b64:
                return None

            return {
                "heatmapBase64": heatmap_b64,
                "overlayBase64": overlay_b64,
                "attentionScore": round(float(explanation.attention_score), 4),
                "regions": [
                    {
                        "x": r.x,
                        "y": r.y,
                        "w": r.w,
                        "h": r.h,
                        "intensity": round(float(r.intensity), 3),
                    }
                    for r in explanation.activation_regions
                ],
                "method": "grad-cam",
                "note": (
                    "AI attention visualization — indicates image regions that "
                    "influenced the prediction. Not a confirmed lesion map."
                ),
            }
        except Exception as exc:
            logger.warning("Grad-CAM failed: %s", exc, exc_info=True)
            return None
