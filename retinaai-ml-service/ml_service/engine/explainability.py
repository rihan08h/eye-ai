"""
RETINAAI — Grad-CAM Explainability

Produces an attention map showing which image regions drove the
classification. This is NOT a lesion map and does not localise pathology.
"""
import cv2
import torch
import numpy as np
from PIL import Image
from dataclasses import dataclass, field
from typing import List, Tuple, Optional
import io
import base64


@dataclass
class ActivationRegion:
    """A detected activation hotspot."""
    x: int = 0
    y: int = 0
    w: int = 0
    h: int = 0
    intensity: float = 0.0


@dataclass
class ExplanationResult:
    """Result of Grad-CAM explanation."""
    heatmap_raw: Optional[np.ndarray] = None     # Raw heatmap [H, W]
    heatmap_colored: Optional[np.ndarray] = None  # Colored heatmap [H, W, 3] BGR
    overlay_image: Optional[np.ndarray] = None    # Original + heatmap blended
    activation_regions: List[ActivationRegion] = field(default_factory=list)
    attention_score: float = 0.0

    def get_heatmap_base64(self) -> str:
        """Encode colored heatmap as base64 PNG."""
        if self.heatmap_colored is None:
            return ""
        return _ndarray_to_base64(self.heatmap_colored)

    def get_overlay_base64(self) -> str:
        """Encode overlay image as base64 PNG."""
        if self.overlay_image is None:
            return ""
        return _ndarray_to_base64(self.overlay_image)

    def to_dict(self) -> dict:
        return {
            "attention_score": round(self.attention_score, 4),
            "activation_regions": [
                {"x": r.x, "y": r.y, "w": r.w, "h": r.h, "intensity": round(r.intensity, 3)}
                for r in self.activation_regions
            ],
            "heatmap_base64": self.get_heatmap_base64(),
            "overlay_base64": self.get_overlay_base64(),
        }


def _ndarray_to_base64(img: np.ndarray) -> str:
    """Convert numpy array to base64 encoded PNG."""
    success, buffer = cv2.imencode(".png", img)
    if not success:
        return ""
    return base64.b64encode(buffer).decode("utf-8")


class GradCAMExplainer:
    """
    Grad-CAM explainability for DR classification models.

    Hooks into the last convolutional layer and computes
    gradient-weighted activation maps.
    """

    def __init__(self, classifier):
        """
        Args:
            classifier: DRClassifier instance.
        """
        self.classifier = classifier
        self.model = classifier.get_inner_model()  # The Model wrapper
        self.device = classifier.device

        # Storage for hook outputs
        self._activations = None
        self._gradients = None
        self._hooks = []

        # Find and hook the target layer
        self._target_layer = self._find_target_layer()
        self._register_hooks()

    def _find_target_layer(self):
        """
        Find the last convolutional layer by architecture.
        DenseNet → features.denseblock4
        ResNet → layer4
        ViT → encoder.layers[-1].ln_1
        """
        inner_model = self.model.model  # torchvision model inside Model wrapper

        # DenseNet
        if hasattr(inner_model, "features") and hasattr(inner_model.features, "denseblock4"):
            return inner_model.features.denseblock4

        # ResNet
        if hasattr(inner_model, "layer4"):
            return inner_model.layer4

        # ViT
        if hasattr(inner_model, "encoder"):
            return inner_model.encoder.layers[-1].ln_1

        # Fallback: find last Conv2d
        target = None
        for module in inner_model.modules():
            if isinstance(module, torch.nn.Conv2d):
                target = module
        if target is not None:
            return target

        raise ValueError("Could not find target layer for Grad-CAM")

    def _register_hooks(self):
        """Register forward and backward hooks on target layer."""
        def forward_hook(module, input, output):
            self._activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self._gradients = grad_output[0].detach()

        self._hooks.append(self._target_layer.register_forward_hook(forward_hook))
        self._hooks.append(self._target_layer.register_full_backward_hook(backward_hook))

    def explain(
        self,
        image,
        predicted_class: int,
        original_image: np.ndarray = None,
        overlay_alpha: float = 0.5,
    ) -> ExplanationResult:
        """
        Generate Grad-CAM explanation.

        Args:
            image: Preprocessed tensor [1, C, H, W] or raw image.
            predicted_class: Class index to explain.
            original_image: Original image (numpy, RGB) for overlay.
            overlay_alpha: Heatmap opacity for overlay.

        Returns:
            ExplanationResult with heatmap and overlay.
        """
        # Preprocess if not already a tensor
        if isinstance(image, torch.Tensor):
            input_tensor = image
        else:
            input_tensor = self.classifier.preprocess(image)

        input_tensor = input_tensor.to(self.device)
        input_tensor.requires_grad_(True)

        # Forward pass
        self.model.eval()
        output = self.model(input_tensor)

        # Backward pass for target class
        self.model.zero_grad()
        target = output[0, predicted_class]
        target.backward()

        if self._activations is None or self._gradients is None:
            return ExplanationResult()

        # Compute Grad-CAM
        gradients = self._gradients[0]   # [C, H, W]
        activations = self._activations[0]  # [C, H, W]

        # Global average pooling of gradients → weights
        weights = torch.mean(gradients, dim=(1, 2))  # [C]

        # Weighted combination of activation maps
        cam = torch.zeros(activations.shape[1:], dtype=torch.float32, device=self.device)
        for i, w in enumerate(weights):
            cam += w * activations[i]

        # ReLU — only positive contributions
        cam = torch.relu(cam)
        cam = cam.cpu().numpy()

        # Normalize to [0, 1]
        if cam.max() > 0:
            cam = cam / cam.max()

        # Determine output size
        if original_image is not None:
            h, w = original_image.shape[:2]
        else:
            h, w = 224, 224

        # Resize heatmap to image size
        heatmap = cv2.resize(cam, (w, h))

        # Apply colormap (Jet: blue → green → yellow → red)
        heatmap_uint8 = np.uint8(255 * heatmap)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # Create overlay
        overlay = None
        if original_image is not None:
            if original_image.shape[2] == 3:
                # Ensure BGR for OpenCV
                original_bgr = cv2.cvtColor(original_image, cv2.COLOR_RGB2BGR)
            else:
                original_bgr = original_image[:, :, :3]
            overlay = cv2.addWeighted(original_bgr, 1 - overlay_alpha, heatmap_colored, overlay_alpha, 0)

        # Detect activation regions (hotspots)
        activation_regions = self._detect_hotspots(heatmap)

        # Attention score (mean of high-activation areas)
        attention_score = float(np.mean(heatmap[heatmap > 0.5])) if np.any(heatmap > 0.5) else 0.0

        return ExplanationResult(
            heatmap_raw=heatmap,
            heatmap_colored=heatmap_colored,
            overlay_image=overlay,
            activation_regions=activation_regions,
            attention_score=attention_score,
        )

    def _detect_hotspots(self, heatmap: np.ndarray, threshold: float = 0.5) -> List[ActivationRegion]:
        """Detect high-activation regions in the heatmap."""
        binary = (heatmap > threshold).astype(np.uint8)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            mask = np.zeros_like(heatmap)
            cv2.drawContours(mask, [contour], -1, 1, -1)
            intensity = float(np.mean(heatmap[mask > 0]))
            regions.append(ActivationRegion(x=x, y=y, w=w, h=h, intensity=intensity))

        # Sort by intensity descending
        regions.sort(key=lambda r: r.intensity, reverse=True)
        return regions[:10]  # Top 10 hotspots

    def cleanup(self):
        """Remove hooks."""
        for hook in self._hooks:
            hook.remove()
        self._hooks.clear()
