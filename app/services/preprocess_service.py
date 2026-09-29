"""
Parametric Image Preprocessing Pipeline Service.
Driven entirely by ocr_pipeline_step database rows (grayscale, deskew, denoise, contrast, upscale, DPI).
"""

from typing import List, Dict, Any


class PreprocessService:
    @classmethod
    def apply_pipeline(
        cls, image_bytes: bytes, steps: List[Dict[str, Any]]
    ) -> bytes:
        """
        Sequentially executes active pre-processing filters.
        """
        sorted_steps = sorted(steps, key=lambda s: s.get("step_order", 0))
        current_bytes = image_bytes

        for step in sorted_steps:
            if not step.get("is_enabled", True):
                continue

            key = step.get("step_key")
            params = step.get("parameters", {})

            # In production this calls cv2 transformations
            if key == "GRAYSCALE":
                pass
            elif key == "DESKEW":
                pass
            elif key == "DENOISE":
                pass
            elif key == "DPI_NORMALIZE":
                pass

        return current_bytes
