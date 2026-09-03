#!/usr/bin/env python3
"""
RETINAAI — pipeline verification.

Runs every stage of the inference path against a real fundus image and reports
exactly which stage fails. Run this before starting the service; it turns an
opaque 503 into a specific, fixable problem.

    python scripts/verify_pipeline.py

Optionally point it at your own image:

    python scripts/verify_pipeline.py path/to/fundus.jpeg

Exit code 0 means the pipeline works end to end.
"""
import os
import sys
import time
import traceback

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

PASS = "\033[32mPASS\033[0m"
FAIL = "\033[31mFAIL\033[0m"
WARN = "\033[33mWARN\033[0m"

_failures = []


def step(name):
    print(f"\n── {name} " + "─" * max(0, 58 - len(name)))


def ok(msg):
    print(f"  [{PASS}] {msg}")


def bad(msg, fix=None):
    print(f"  [{FAIL}] {msg}")
    if fix:
        print(f"         fix: {fix}")
    _failures.append(msg)


def warn(msg):
    print(f"  [{WARN}] {msg}")


def check_dependencies():
    step("1. Dependencies")
    required = {
        "torch": "pip install -r ml_service/requirements.txt",
        "torchvision": "pip install -r ml_service/requirements.txt",
        "lightning": "pip install lightning==2.2.1",
        "cv2": "pip install opencv-python-headless",
        "PIL": "pip install pillow",
        "numpy": "pip install numpy",
        "matplotlib": "pip install matplotlib",
        "fastapi": "pip install fastapi uvicorn python-multipart",
    }
    for module, fix in required.items():
        try:
            __import__(module)
            ok(module)
        except ImportError:
            bad(f"{module} is not installed", fix)
    return not _failures


def check_checkpoint():
    step("2. Model checkpoint")
    path = os.path.join(PROJECT_ROOT, "artifacts", "dr-model.ckpt")

    if not os.path.exists(path):
        bad(f"missing: {path}", "git lfs install && git lfs pull")
        return None

    size = os.path.getsize(path)

    with open(path, "rb") as f:
        head = f.read(64)

    if head.startswith(b"version https://git-lfs"):
        bad(
            f"this is a Git LFS pointer, not the model ({size} bytes)",
            "git lfs install && git lfs pull",
        )
        return None

    if size < 1_000_000:
        bad(f"only {size} bytes — too small to be a checkpoint")
        return None

    ok(f"{path} ({size / 1_048_576:.1f} MB)")

    try:
        import torch

        ckpt = torch.load(path, map_location="cpu", weights_only=False)
        hparams = ckpt.get("hyper_parameters", {}) or {}
        arch = hparams.get("model_name", "unknown")
        classes = hparams.get("num_classes", "unknown")
        ok(f"architecture: {arch}, num_classes: {classes}")

        if arch == "unknown":
            warn("model_name absent from checkpoint hyperparameters")
        if classes != 5:
            warn(f"expected 5 DR classes, checkpoint says {classes}")

        return path
    except Exception as exc:
        bad(f"checkpoint will not load: {exc}")
        return None


def find_sample_image(argv):
    step("3. Test image")
    if len(argv) > 1:
        candidate = argv[1]
        if os.path.exists(candidate):
            ok(f"using {candidate}")
            return candidate
        bad(f"{candidate} does not exist")
        return None

    sample_dir = os.path.join(PROJECT_ROOT, "data", "sample")
    if os.path.isdir(sample_dir):
        images = sorted(
            f for f in os.listdir(sample_dir) if f.lower().endswith((".jpeg", ".jpg", ".png"))
        )
        if images:
            path = os.path.join(sample_dir, images[0])
            ok(f"using {path}")
            return path

    bad("no sample image found", "pass one: python scripts/verify_pipeline.py my_fundus.jpg")
    return None


def run_pipeline(checkpoint_path, image_path):
    import cv2
    import numpy as np
    from PIL import Image

    pil_image = Image.open(image_path).convert("RGB")
    bgr = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    ok_shape = f"{pil_image.width}x{pil_image.height}"

    # ── Quality ─────────────────────────────────────────────────────────────
    step("4. Image quality assessment")
    try:
        from ml_service.engine.quality import ImageQualityAssessor
        from ml_service.config import QUALITY_THRESHOLDS

        assessor = ImageQualityAssessor(**QUALITY_THRESHOLDS)
        started = time.perf_counter()
        quality = assessor.assess(bgr)
        elapsed = (time.perf_counter() - started) * 1000

        ok(f"assessed {ok_shape} image in {elapsed:.0f} ms")
        print(f"         overall {quality.overall_score:.2f} | gradable={quality.usable}")
        print(
            f"         blur={quality.blur_score:.1f}({quality.blur_ok}) "
            f"brightness={quality.brightness:.1f}({quality.brightness_ok}) "
            f"contrast={quality.contrast:.1f}({quality.contrast_ok}) "
            f"centering={quality.centering_score:.2f}({quality.centered_ok})"
        )
        if quality.feedback:
            for issue in quality.feedback:
                print(f"         issue: {issue}")
        if not quality.usable:
            warn("this image is ungradable — the service would stop here and ask for a recapture")
    except Exception as exc:
        bad(f"quality assessment failed: {exc}")
        traceback.print_exc()
        return

    # ── Model load ──────────────────────────────────────────────────────────
    step("5. Model loading")
    try:
        from ml_service.engine.classifier import DRClassifier

        started = time.perf_counter()
        classifier = DRClassifier(checkpoint_path=checkpoint_path)
        elapsed = time.perf_counter() - started
        ok(f"loaded on {classifier.device} in {elapsed:.1f} s")
    except Exception as exc:
        bad(f"model would not load: {exc}")
        traceback.print_exc()
        return

    # ── Classification ──────────────────────────────────────────────────────
    step("6. DR classification")
    try:
        started = time.perf_counter()
        result = classifier.predict(pil_image)
        elapsed = (time.perf_counter() - started) * 1000

        ok(f"predicted '{result.predicted_label}' at {result.confidence:.1%} in {elapsed:.0f} ms")
        for label, prob in result.all_probabilities.items():
            bar = "█" * int(prob * 40)
            print(f"         {label:<18} {prob:6.2%} {bar}")

        total = sum(result.all_probabilities.values())
        if abs(total - 1.0) > 0.01:
            bad(f"probabilities sum to {total:.4f}, not 1.0 — softmax may be misapplied")
        else:
            ok("probabilities sum to 1.0")
    except Exception as exc:
        bad(f"classification failed: {exc}")
        traceback.print_exc()
        return

    # ── Uncertainty ─────────────────────────────────────────────────────────
    step("7. Uncertainty")
    try:
        from ml_service.engine.uncertainty import UncertaintyEngine
        from ml_service.config import UNCERTAINTY_THRESHOLDS

        engine = UncertaintyEngine(**UNCERTAINTY_THRESHOLDS)
        unc = engine.assess(result.all_probabilities)
        ok(f"level={unc.level} margin={unc.margin:.3f} entropy={unc.entropy:.3f}")
        print(f"         review required: {unc.review_required}")
    except Exception as exc:
        bad(f"uncertainty assessment failed: {exc}")
        traceback.print_exc()

    # ── Grad-CAM ────────────────────────────────────────────────────────────
    step("8. Grad-CAM explainability")
    try:
        from ml_service.engine.explainability import GradCAMExplainer

        explainer = GradCAMExplainer(classifier)
        layer_name = type(explainer._target_layer).__name__
        ok(f"hooked target layer: {layer_name}")

        started = time.perf_counter()
        explanation = explainer.explain(
            image=pil_image,
            predicted_class=result.predicted_class,
            original_image=bgr,
        )
        elapsed = (time.perf_counter() - started) * 1000

        if explanation.heatmap_colored is None:
            bad("Grad-CAM produced no heatmap — hooks did not capture activations")
        else:
            ok(
                f"heatmap {explanation.heatmap_colored.shape} in {elapsed:.0f} ms, "
                f"attention={explanation.attention_score:.3f}, "
                f"{len(explanation.activation_regions)} hotspot(s)"
            )

            b64 = explanation.get_heatmap_base64()
            if b64:
                ok(f"base64 encoding works ({len(b64)} chars)")
            else:
                bad("heatmap could not be base64 encoded")

            out_dir = os.path.join(PROJECT_ROOT, "artifacts", "verify_output")
            os.makedirs(out_dir, exist_ok=True)
            import cv2 as _cv2

            _cv2.imwrite(os.path.join(out_dir, "heatmap.png"), explanation.heatmap_colored)
            if explanation.overlay_image is not None:
                _cv2.imwrite(os.path.join(out_dir, "overlay.png"), explanation.overlay_image)
            ok(f"wrote images to {out_dir} — open them and check the heatmap varies by image")

        explainer.cleanup()
    except Exception as exc:
        bad(f"Grad-CAM failed: {exc}")
        traceback.print_exc()

    # ── Full service path ───────────────────────────────────────────────────
    step("9. Full service pipeline")
    try:
        from ml_service.inference import InferenceEngine

        engine = InferenceEngine.get_instance()
        payload = engine.analyze(pil_image, bgr)
        ok(f"status={payload['status']} modelVersion={payload['modelVersion']}")
        ok(f"processing time {payload['processingTimeMs']} ms")

        if payload["status"] == "ok":
            expected = {"noDR", "mild", "moderate", "severe", "proliferative"}
            got = set(payload["probabilities"] or {})
            if got == expected:
                ok("probability keys match the Mongoose schema")
            else:
                bad(f"probability keys are {got}, expected {expected}")

            if payload["explainability"]:
                ok("explainability present in the response")
            else:
                warn("no explainability in the response — the UI will show 'unavailable'")

        if payload["isMock"] is not False:
            bad("isMock is not False on a real inference result")
        else:
            ok("isMock=False")
    except Exception as exc:
        bad(f"service pipeline failed: {exc}")
        traceback.print_exc()


def main():
    print("RETINAAI — pipeline verification")

    if not check_dependencies():
        print(f"\n{len(_failures)} problem(s) found. Install dependencies first.\n")
        return 1

    checkpoint = check_checkpoint()
    image = find_sample_image(sys.argv)

    if checkpoint and image:
        run_pipeline(checkpoint, image)

    print("\n" + "=" * 62)
    if _failures:
        print(f"{len(_failures)} problem(s):\n")
        for failure in _failures:
            print(f"  - {failure}")
        print("\nThe service will not produce results until these are resolved.\n")
        return 1

    print("Pipeline verified end to end.\n")
    print("Next:")
    print("  uvicorn ml_service.main:app --host 127.0.0.1 --port 8001")
    print("  curl http://localhost:8001/health\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
