"""Locate the answer sheet in an image and warp it to the canonical top-down page.

Primary path: detect the four corner ArUco markers and map their centers onto the
known canonical positions (geometry.marker_reference_quad). This is robust to skew,
rotation and perspective from phone photos.

Fallback path: the original PyImageSearch approach -- Canny edges, then the largest
4-point contour -- so sheets without markers (e.g. the original tutorial samples)
still grade. `order_points` / `four_point_transform` are reused from the notebook.
"""
from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from .config import ExamConfig
from .geometry import CORNER_ORDER, MARKER_IDS, marker_reference_quad
from .sheet_generator import ARUCO_DICT


class SheetNotFoundError(RuntimeError):
    """Raised when neither ArUco markers nor a 4-point paper contour can be found."""


@dataclass
class WarpResult:
    warped: np.ndarray   # canonical-size grayscale (or BGR) top-down image
    method: str          # "aruco" or "contour"


# --- geometry helpers reused verbatim from the original notebook ---
def order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    rect = order_points(pts)
    (tl, tr, br, bl) = rect
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))
    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))
    dst = np.array(
        [[0, 0], [maxWidth - 1, 0], [maxWidth - 1, maxHeight - 1], [0, maxHeight - 1]],
        dtype="float32",
    )
    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, M, (maxWidth, maxHeight))


def _detect_marker_centers(gray: np.ndarray) -> dict:
    """Return {corner_name: (x, y)} for each ArUco marker found, by known ID."""
    dictionary = cv2.aruco.getPredefinedDictionary(ARUCO_DICT)
    params = cv2.aruco.DetectorParameters()
    detector = cv2.aruco.ArucoDetector(dictionary, params)
    corners, ids, _ = detector.detectMarkers(gray)
    if ids is None:
        return {}
    id_to_corner = {v: k for k, v in MARKER_IDS.items()}
    centers = {}
    for marker_corners, marker_id in zip(corners, ids.flatten()):
        corner_name = id_to_corner.get(int(marker_id))
        if corner_name is not None:
            centers[corner_name] = marker_corners.reshape(4, 2).mean(axis=0)
    return centers


def _warp_with_aruco(image: np.ndarray, gray: np.ndarray, cfg: ExamConfig):
    centers = _detect_marker_centers(gray)
    if not all(c in centers for c in CORNER_ORDER):
        return None
    src = np.array([centers[c] for c in CORNER_ORDER], dtype="float32")
    dst = marker_reference_quad(cfg)
    M = cv2.getPerspectiveTransform(src, dst)
    size = (cfg.layout.page_width, cfg.layout.page_height)
    return cv2.warpPerspective(image, M, size)


def _warp_with_contour(image: np.ndarray, gray: np.ndarray):
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 75, 200)
    cnts, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
    for c in cnts:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            return four_point_transform(image, approx.reshape(4, 2))
    return None


def locate_and_warp(image: np.ndarray, cfg: ExamConfig) -> WarpResult:
    """Return a top-down warped view of the sheet, preferring ArUco markers."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if image.ndim == 3 else image

    warped = _warp_with_aruco(image, gray, cfg)
    if warped is not None:
        return WarpResult(warped=warped, method="aruco")

    warped = _warp_with_contour(image, gray)
    if warped is not None:
        return WarpResult(warped=warped, method="contour")

    raise SheetNotFoundError(
        "Could not locate the sheet: no 4 ArUco markers and no 4-point paper contour found."
    )
