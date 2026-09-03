"""
RETINAAI — DR Classification Wrapper

Wraps the trained DRModel (PyTorch Lightning, src/model.py) for inference.
Handles model loading, preprocessing, and prediction. No result is ever
synthesised here; if the model cannot run, this raises.
"""
import os
import sys
import torch
import numpy as np
from PIL import Image
from torchvision import transforms as T
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional

# ml_service/engine/classifier.py -> ml_service/engine -> ml_service -> repo root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from src.model import DRModel


@dataclass
class ClassificationResult:
    """Result of DR classification."""
    predicted_class: int = 0
    predicted_label: str = "No DR"
    confidence: float = 0.0
    all_probabilities: Dict[str, float] = field(default_factory=dict)
    top_k: List[Tuple[str, float]] = field(default_factory=list)
    logits: Optional[torch.Tensor] = None
    model_version: str = ""

    def to_dict(self) -> dict:
        return {
            "predicted_class": self.predicted_class,
            "predicted_label": self.predicted_label,
            "confidence": round(self.confidence, 4),
            "all_probabilities": {k: round(v, 4) for k, v in self.all_probabilities.items()},
            "top_k": [(k, round(v, 4)) for k, v in self.top_k],
            "model_version": self.model_version,
        }


class DRClassifier:
    """Wraps the trained DRModel for inference."""

    LABELS = {
        0: "No DR",
        1: "Mild",
        2: "Moderate",
        3: "Severe",
        4: "Proliferative DR",
    }

    def __init__(
        self,
        checkpoint_path: str = None,
        model_version: str = "retina-v1.0-densenet169",
        image_size: int = 224,
        device: str = None,
    ):
        if checkpoint_path is None:
            checkpoint_path = os.path.join(PROJECT_ROOT, "artifacts", "dr-model.ckpt")

        self.model_version = model_version
        self.image_size = image_size
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")

        # Load model
        # pretrained=False: load_from_checkpoint overwrites the backbone
        # immediately, so downloading ImageNet weights first is wasted time and
        # a hard internet dependency at startup — which a rural deployment or an
        # air-gapped clinic machine will not have.
        self.model = DRModel.load_from_checkpoint(
            checkpoint_path, map_location=self.device, pretrained=False
        )
        self.model.eval()
        self.model.to(self.device)

        # Preprocessing transform (matches training)
        self.transform = T.Compose([
            T.Resize((image_size, image_size)),
            T.ToTensor(),
            T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

    def preprocess(self, image) -> torch.Tensor:
        """
        Preprocess an image for model input.

        Args:
            image: PIL Image, numpy array (RGB/BGR), or file path.

        Returns:
            Preprocessed tensor [1, C, H, W].
        """
        if isinstance(image, str):
            image = Image.open(image).convert("RGB")
        elif isinstance(image, np.ndarray):
            if image.shape[2] == 4:  # RGBA
                image = image[:, :, :3]
            # Convert BGR to RGB if needed (OpenCV default is BGR)
            image = Image.fromarray(image)

        if not isinstance(image, Image.Image):
            image = Image.fromarray(np.array(image))

        image = image.convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        return tensor

    def predict(self, image) -> ClassificationResult:
        """
        Run DR classification on an image.

        Args:
            image: PIL Image, numpy array, or file path.

        Returns:
            ClassificationResult with prediction details.
        """
        tensor = self.preprocess(image)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.nn.functional.softmax(logits[0], dim=0)

        probs_np = probs.cpu().numpy()
        predicted_class = int(np.argmax(probs_np))
        confidence = float(probs_np[predicted_class])

        all_probabilities = {
            self.LABELS[i]: float(probs_np[i]) for i in range(len(self.LABELS))
        }

        # Top-K sorted predictions
        sorted_indices = np.argsort(probs_np)[::-1]
        top_k = [
            (self.LABELS[int(idx)], float(probs_np[idx]))
            for idx in sorted_indices[:3]
        ]

        return ClassificationResult(
            predicted_class=predicted_class,
            predicted_label=self.LABELS[predicted_class],
            confidence=confidence,
            all_probabilities=all_probabilities,
            top_k=top_k,
            logits=logits[0].cpu(),
            model_version=self.model_version,
        )

    def get_inner_model(self):
        """Get the underlying PyTorch model for Grad-CAM hooks."""
        return self.model.model  # DRModel -> Model wrapper -> actual torchvision model
