"""
RETINAAI — Image Quality Assessment

Algorithmic quality assessment using image processing metrics:
- Blur detection (Laplacian variance over the retinal disc)
- Brightness and contrast within the illuminated region
- Retina centering via circular mask fitting
- Retina plausibility heuristic (warning only)

Metrics are computed on a fixed-size working copy so thresholds mean the
same thing for a tabletop fundus camera and a smartphone adapter.
"""
import cv2
import numpy as np
from dataclasses import dataclass, field
from typing import List


@dataclass
class QualityResult:
    """Result of image quality assessment."""
    overall_score: float = 0.0
    blur_score: float = 0.0
    blur_ok: bool = False
    brightness: float = 0.0
    brightness_ok: bool = False
    contrast: float = 0.0
    contrast_ok: bool = False
    centering_score: float = 0.0
    centered_ok: bool = False
    usable: bool = False
    retina_plausible: bool = True
    colour_ratio: float = 0.0
    feedback: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "overall_score": round(self.overall_score, 3),
            "blur_score": round(self.blur_score, 1),
            "blur_ok": self.blur_ok,
            "brightness": round(self.brightness, 1),
            "brightness_ok": self.brightness_ok,
            "contrast": round(self.contrast, 1),
            "contrast_ok": self.contrast_ok,
            "centering_score": round(self.centering_score, 3),
            "centered_ok": self.centered_ok,
            "usable": self.usable,
            "retina_plausible": self.retina_plausible,
            "colour_ratio": round(self.colour_ratio, 3),
            "feedback": self.feedback,
        }


class ImageQualityAssessor:
    """Assess retinal image quality using algorithmic metrics."""

    def __init__(
        self,
        blur_threshold: float = 100.0,
        brightness_min: float = 40.0,
        brightness_max: float = 220.0,
        contrast_threshold: float = 30.0,
        centering_threshold: float = 0.3,
        overall_min: float = 0.5,
    ):
        self.blur_threshold = blur_threshold
        self.brightness_min = brightness_min
        self.brightness_max = brightness_max
        self.contrast_threshold = contrast_threshold
        self.centering_threshold = centering_threshold
        self.overall_min = overall_min

    def assess(self, image: np.ndarray) -> QualityResult:
        """
        Assess image quality.

        Args:
            image: BGR numpy array (OpenCV format) or RGB numpy array.

        Returns:
            QualityResult with all quality metrics.
        """
        result = QualityResult()

        if image is None or image.size == 0:
            result.feedback.append("Invalid or empty image")
            return result

        # Convert to grayscale if needed
        if len(image.shape) == 3:
            if image.shape[2] == 4:  # RGBA
                image_bgr = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)
            else:
                image_bgr = image
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            image_bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

        # Normalise resolution before measuring sharpness and contrast.
        #
        # Laplacian variance scales with pixel density: the same retina at
        # 3000x2000 and at 512x512 produces very different numbers, so a fixed
        # threshold silently means something different for a tabletop fundus
        # camera than for a smartphone adapter. Measuring on a fixed-size copy
        # makes the threshold device-independent.
        work = self._normalise(gray)

        # Restrict measurement to the retinal disc. A fundus photo is a bright
        # circle on a black rectangle; averaging the border in drags brightness
        # down and inflates contrast, so both were being measured on the wrong
        # pixels.
        mask = self._retina_mask(work)

        # 1. Blur detection — Laplacian variance over the retinal region
        result.blur_score = self._check_blur(work, mask)
        result.blur_ok = result.blur_score > self.blur_threshold

        # 2. Brightness check
        result.brightness = self._check_brightness(work, mask)
        result.brightness_ok = self.brightness_min < result.brightness < self.brightness_max

        # 3. Contrast check
        result.contrast = self._check_contrast(work, mask)
        result.contrast_ok = result.contrast > self.contrast_threshold

        # 4. Centering check — circular mask fit
        result.centering_score = self._check_centering(work)

        # 5. Retina plausibility (HEURISTIC, warning only)
        result.colour_ratio = self._colour_ratio(image_bgr)
        result.retina_plausible = result.colour_ratio >= self.RETINA_MIN_COLOUR_RATIO
        result.centered_ok = result.centering_score > self.centering_threshold

        # Overall score (weighted average)
        # Each metric is normalised so that "at threshold" scores ~0.5 and
        # comfortably-above-threshold saturates at 1.0.
        blur_norm = min(result.blur_score / (self.blur_threshold * 2), 1.0)
        bright_norm = 1.0 - abs(result.brightness - 128) / 128
        contrast_norm = min(result.contrast / (self.contrast_threshold * 2), 1.0)
        center_norm = result.centering_score

        result.overall_score = (
            0.35 * blur_norm
            + 0.20 * max(bright_norm, 0)
            + 0.20 * contrast_norm
            + 0.25 * center_norm
        )

        # Usability
        result.usable = all([
            result.blur_ok, result.brightness_ok,
            result.contrast_ok, result.centered_ok
        ])

        # Feedback messages
        if not result.brightness_ok:
            if result.brightness <= self.brightness_min:
                result.feedback.append("Image is too dark — increase illumination")
            else:
                result.feedback.append("Image is overexposed — reduce illumination")
        if not result.contrast_ok:
            result.feedback.append("Low contrast — adjust camera focus/lighting")
        if not result.blur_ok:
            result.feedback.append("Image is blurry — hold camera steady")
        if not result.centered_ok:
            result.feedback.append("Retina not centered — adjust camera position")

        if not result.retina_plausible:
            result.feedback.append(
                "This may not be a retinal fundus image — please confirm before screening"
            )

        if result.usable and not result.feedback:
            result.feedback.append("Image quality is good")

        return result

    WORK_SIZE = 512  # fixed measurement resolution

    # Fundus photographs are strongly red-dominant because of choroidal
    # blood supply. Across the sample images in this repository the red/green
    # ratio ranges 1.11-1.84, while grey, blue and green non-retinal images
    # sit at or below 1.0.
    #
    # HEURISTIC, AND CALIBRATED ON TEN IMAGES. It is deliberately a warning
    # and never a rejection: blocking a screening on a colour ratio derived
    # from this little evidence would fail more real captures than it catches
    # wrong ones. It exists so an operator who uploads the wrong photo sees
    # something, not as a fundus detector.
    RETINA_MIN_COLOUR_RATIO = 1.05

    @staticmethod
    def _colour_ratio(image_bgr: np.ndarray) -> float:
        """Mean red / mean green over the illuminated region."""
        if image_bgr is None or len(image_bgr.shape) != 3:
            return 0.0
        blue, green, red = cv2.split(image_bgr.astype(np.float32))
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        mask = gray > 12
        if mask.sum() < gray.size * 0.02:
            mask = np.ones_like(gray, dtype=bool)
        return float(red[mask].mean() / (green[mask].mean() + 1e-6))

    def _normalise(self, gray: np.ndarray) -> np.ndarray:
        """Resize to a fixed square so metrics are comparable across devices."""
        if gray.shape[:2] == (self.WORK_SIZE, self.WORK_SIZE):
            return gray
        interp = cv2.INTER_AREA if gray.shape[0] > self.WORK_SIZE else cv2.INTER_LINEAR
        return cv2.resize(gray, (self.WORK_SIZE, self.WORK_SIZE), interpolation=interp)

    @staticmethod
    def _retina_mask(gray: np.ndarray) -> np.ndarray:
        """
        Boolean mask of the illuminated retinal disc.

        Falls back to the whole frame when the image has no dark border, which
        is what a cropped or already-processed image looks like.
        """
        mask = gray > 12
        if mask.sum() < gray.size * 0.10:
            return np.ones_like(gray, dtype=bool)
        return mask

    def _check_blur(self, gray: np.ndarray, mask: np.ndarray = None) -> float:
        """Laplacian variance over the retinal region as a sharpness metric."""
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        if mask is not None:
            # Erode so the hard border between disc and black frame — a strong
            # edge that has nothing to do with focus — is excluded.
            eroded = cv2.erode(
                mask.astype(np.uint8), np.ones((9, 9), np.uint8), iterations=1
            ).astype(bool)
            if eroded.sum() > 100:
                return float(laplacian[eroded].var())
        return float(laplacian.var())

    def _check_brightness(self, gray: np.ndarray, mask: np.ndarray = None) -> float:
        """Mean brightness of the retinal region."""
        if mask is not None and mask.sum() > 100:
            return float(np.mean(gray[mask]))
        return float(np.mean(gray))

    def _check_contrast(self, gray: np.ndarray, mask: np.ndarray = None) -> float:
        """Standard deviation within the retinal region as a contrast metric."""
        if mask is not None and mask.sum() > 100:
            return float(np.std(gray[mask]))
        return float(np.std(gray))

    def _check_centering(self, gray: np.ndarray) -> float:
        """
        Check if retina is centered using circular mask fitting.
        Returns a score 0-1 indicating how well a circle fits.
        """
        h, w = gray.shape

        # Threshold to find the retinal region
        _, binary = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)

        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return 0.0

        # Get largest contour (presumably the retina)
        largest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        total_area = h * w

        if area < total_area * 0.05:
            return 0.0

        # Check circularity and centering
        (cx, cy), radius = cv2.minEnclosingCircle(largest)

        # How close is the center to the image center?
        center_dist = np.sqrt((cx - w / 2) ** 2 + (cy - h / 2) ** 2)
        max_dist = np.sqrt((w / 2) ** 2 + (h / 2) ** 2)
        center_score = 1.0 - (center_dist / max_dist)

        # How circular is the contour?
        perimeter = cv2.arcLength(largest, True)
        if perimeter == 0:
            return 0.0
        circularity = 4 * np.pi * area / (perimeter ** 2)

        return float(center_score * 0.6 + circularity * 0.4)
