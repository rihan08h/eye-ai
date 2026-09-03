"""
RETINAAI inference engine.

Four independent stages, each usable on its own:

    ImageQualityAssessor  gate before the model runs  (needs cv2 only)
    DRClassifier          the trained model            (needs torch)
    UncertaintyEngine     entropy and top-two margin   (stdlib only)
    GradCAMExplainer      attention map                (needs torch)

Deliberately absent: lesion detection. No lesion segmentation or detection
model is integrated, so this package reports no microaneurysms, hemorrhages,
exudates or cotton wool spots. A deleted module, findings.py,
derives such findings from a hardcoded severity lookup table; it is not
imported here and must not be.

Exports are resolved lazily (PEP 562). Importing quality or uncertainty must
not drag in torch — the quality gate and the verification script's early
stages need to run on machines where the ML stack is absent or still
installing, and eager imports here would make that impossible.
"""
__all__ = [
    "ImageQualityAssessor",
    "QualityResult",
    "DRClassifier",
    "ClassificationResult",
    "UncertaintyEngine",
    "UncertaintyResult",
    "GradCAMExplainer",
    "ExplanationResult",
]

_MODULE_OF = {
    "ImageQualityAssessor": "quality",
    "QualityResult": "quality",
    "DRClassifier": "classifier",
    "ClassificationResult": "classifier",
    "UncertaintyEngine": "uncertainty",
    "UncertaintyResult": "uncertainty",
    "GradCAMExplainer": "explainability",
    "ExplanationResult": "explainability",
}


def __getattr__(name):
    """Import the owning submodule only when the symbol is actually used."""
    module_name = _MODULE_OF.get(name)
    if module_name is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

    from importlib import import_module

    module = import_module(f"{__name__}.{module_name}")
    return getattr(module, name)


def __dir__():
    return sorted(__all__)
