"""
RETINAAI — Uncertainty Estimation

Quantifies prediction uncertainty using Shannon entropy over the class
distribution and the margin between the top two classes. Separate from
model confidence, which is only the top softmax probability.
"""
import math
from dataclasses import dataclass
from typing import Dict


@dataclass
class UncertaintyResult:
    """Result of uncertainty assessment."""
    entropy: float = 0.0
    margin: float = 0.0
    level: str = "LOW"        # LOW, MODERATE, HIGH, CRITICAL
    is_borderline: bool = False
    review_required: bool = False
    message: str = ""

    def to_dict(self) -> dict:
        return {
            "entropy": round(self.entropy, 4),
            "margin": round(self.margin, 4),
            "level": self.level,
            "is_borderline": self.is_borderline,
            "review_required": self.review_required,
            "message": self.message,
        }


class UncertaintyEngine:
    """Assess prediction uncertainty using entropy and margin analysis."""

    def __init__(
        self,
        low_margin: float = 0.40,
        moderate_margin: float = 0.20,
        high_margin: float = 0.10,
        borderline_margin: float = 0.15,
    ):
        self.low_margin = low_margin
        self.moderate_margin = moderate_margin
        self.high_margin = high_margin
        self.borderline_margin = borderline_margin

    def assess(self, probabilities: Dict[str, float]) -> UncertaintyResult:
        """
        Assess prediction uncertainty.

        Args:
            probabilities: Dict of {label: probability} from classifier.

        Returns:
            UncertaintyResult with entropy, margin, and confidence level.
        """
        probs = list(probabilities.values())

        # Shannon entropy
        entropy = 0.0
        for p in probs:
            if p > 1e-10:
                entropy -= p * math.log2(p)

        # Margin between top two predictions
        sorted_probs = sorted(probs, reverse=True)
        margin = sorted_probs[0] - sorted_probs[1] if len(sorted_probs) > 1 else sorted_probs[0]

        # Determine confidence level
        if margin > self.low_margin:
            level = "LOW"
            message = "AI is confident in this prediction."
        elif margin > self.moderate_margin:
            level = "MODERATE"
            message = "Moderate uncertainty — specialist review recommended."
        elif margin > self.high_margin:
            level = "HIGH"
            message = "Significant uncertainty — specialist review strongly recommended."
        else:
            level = "CRITICAL"
            message = "Prediction uncertain — do not use without specialist review."

        is_borderline = margin < self.borderline_margin
        review_required = level != "LOW"

        if is_borderline:
            # Identify top two labels
            sorted_labels = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
            top_label, top_prob = sorted_labels[0]
            second_label, second_prob = sorted_labels[1]
            message = (
                f"BORDERLINE: {top_label} ({top_prob:.0%}) vs "
                f"{second_label} ({second_prob:.0%}). "
                "Prediction uncertain — specialist review required."
            )

        return UncertaintyResult(
            entropy=entropy,
            margin=margin,
            level=level,
            is_borderline=is_borderline,
            review_required=review_required,
            message=message,
        )
