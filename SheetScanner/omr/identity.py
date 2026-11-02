"""Read the student/exam identity QR code from a sheet.

Uses OpenCV's built-in QRCodeDetector so there is no system-level zbar dependency.
The generator encodes a JSON payload {"exam": ..., "student": ..., "page_index": ...};
this returns it parsed, tolerating a plain-string payload too.

QRs generated before multi-page support have no "page_index" key; those decode to
`page_index = None`, which the backend treats as page 0.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np


@dataclass
class Identity:
    student_id: Optional[str] = None
    exam_id: Optional[str] = None
    page_index: Optional[int] = None
    raw: Optional[str] = None


def _decode(image: np.ndarray) -> str:
    """Try to decode a QR, retrying upscaled (the detector is unreliable at small sizes)."""
    detector = cv2.QRCodeDetector()
    for scale in (1, 2, 3):
        img = image if scale == 1 else cv2.resize(
            image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC
        )
        data, _, _ = detector.detectAndDecode(img)
        if data:
            return data
    return ""


def _parse_page_index(value) -> Optional[int]:
    if isinstance(value, bool) or value is None:
        return None
    try:
        idx = int(value)
    except (TypeError, ValueError):
        return None
    return idx if idx >= 0 else None


def read_identity(image: np.ndarray) -> Identity:
    """Decode the QR code on a sheet (raw photo or warped page)."""
    data = _decode(image)
    if not data:
        return Identity()

    try:
        payload = json.loads(data)
        if not isinstance(payload, dict):
            raise AttributeError("QR payload is not an object")
        return Identity(
            student_id=payload.get("student") or None,
            exam_id=payload.get("exam") or None,
            page_index=_parse_page_index(payload.get("page_index")),
            raw=data,
        )
    except (json.JSONDecodeError, AttributeError):
        # Non-JSON QR -> treat the whole string as the student id.
        return Identity(student_id=data, raw=data)
