"""Generate printable OMR answer sheets.

Each sheet carries:
  * four ArUco markers (one per corner) so the grader can recover a perfect
    top-down view even from a skewed phone photo, and
  * a QR code encoding the student/exam id so results can be tied to a person.

The bubble grid is drawn at the canonical coordinates defined in geometry.py, which
is exactly where the grader later looks for marks.

Multi-page exams
----------------
An exam with more questions than fit on one canonical page is rendered as several
pages. Every page is a standalone OMR document with its own four ArUco markers and
its own QR code; the QR payload additionally carries ``page_index`` so the grader
can tell which page it is looking at. The ArUco marker IDs are deliberately the
same on every page: each page is warped independently, so they never conflict.

Question numbers are printed using their *global* index (1..N across the whole
exam), not restarting on each page.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional, Sequence, Union

import cv2
import numpy as np
import qrcode

from .config import ExamConfig
from .geometry import MARKER_IDS, bubble_center_on_page, marker_centers

ARUCO_DICT = cv2.aruco.DICT_4X4_50
_FONT = cv2.FONT_HERSHEY_SIMPLEX


def _aruco_dictionary():
    # cv2 >= 4.7 API
    return cv2.aruco.getPredefinedDictionary(ARUCO_DICT)


def _make_marker(marker_id: int, size: int) -> np.ndarray:
    img = cv2.aruco.generateImageMarker(_aruco_dictionary(), marker_id, size)
    return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)


def _make_qr(payload: str, size: int) -> np.ndarray:
    qr = qrcode.QRCode(box_size=10, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    pil_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    arr = np.array(pil_img)[:, :, ::-1]  # RGB -> BGR
    return cv2.resize(arr, (size, size), interpolation=cv2.INTER_NEAREST)


def generate_page(
    cfg: ExamConfig,
    student_id: Optional[str] = None,
    page_index: int = 0,
) -> np.ndarray:
    """Render a single page of the answer sheet as a BGR image."""
    lay = cfg.layout
    page = np.full((lay.page_height, lay.page_width, 3), 255, dtype=np.uint8)

    # --- corner ArUco markers ---
    for corner, (cx, cy) in marker_centers(cfg).items():
        m = _make_marker(MARKER_IDS[corner], lay.marker_size)
        x0 = int(cx - lay.marker_size / 2)
        y0 = int(cy - lay.marker_size / 2)
        page[y0: y0 + lay.marker_size, x0: x0 + lay.marker_size] = m

    # --- QR code (top center) with exam + student id + page index ---
    payload = json.dumps({
        "exam": cfg.exam_id,
        "student": student_id or "",
        "page_index": page_index,
    })
    qr_size = 110
    qr = _make_qr(payload, qr_size)
    qx = (lay.page_width - qr_size) // 2
    qy = lay.marker_margin
    page[qy: qy + qr_size, qx: qx + qr_size] = qr

    # --- header text (below the QR / markers) ---
    cv2.putText(page, "OMR ANSWER SHEET", (lay.margin_left, 185), _FONT, 1.0, (0, 0, 0), 2)
    cv2.putText(page, f"Exam: {cfg.exam_id}", (lay.margin_left, 218), _FONT, 0.6, (0, 0, 0), 1)
    cv2.putText(
        page, f"Student: {student_id or '__________'}", (lay.margin_left, 245),
        _FONT, 0.6, (0, 0, 0), 1,
    )
    if cfg.page_count > 1:
        cv2.putText(
            page, f"Page {page_index + 1}/{cfg.page_count}", (lay.margin_left, 272),
            _FONT, 0.6, (0, 0, 0), 1,
        )

    questions = cfg.questions_on_page(page_index)

    # --- choice-letter header row ---
    header_y = lay.margin_top - lay.row_spacing + 6
    for c in range(cfg.choices_per_q):
        x, _ = bubble_center_on_page(cfg, page_index, 0, c)
        cv2.putText(page, cfg.letter(c), (x - 8, header_y), _FONT, 0.6, (0, 0, 0), 2)

    # --- bubbles (numbered by their global question index) ---
    for row, q in enumerate(questions):
        qy_label = lay.margin_top + row * lay.row_spacing + 6
        cv2.putText(page, f"{q + 1}.", (lay.margin_left - 60, qy_label), _FONT, 0.6, (0, 0, 0), 2)
        for c in range(cfg.choices_per_q):
            x, y = bubble_center_on_page(cfg, page_index, row, c)
            cv2.circle(page, (x, y), lay.bubble_radius, (0, 0, 0), 2)

    return page


def generate_sheet(
    cfg: ExamConfig,
    student_id: Optional[str] = None,
) -> np.ndarray:
    """Render a blank answer sheet as a BGR image (first page of a multi-page exam)."""
    return generate_page(cfg, student_id=student_id, page_index=0)


def generate_sheets(
    cfg: ExamConfig,
    student_id: Optional[str] = None,
) -> List[np.ndarray]:
    """Render every page of the answer sheet; one image per page."""
    return [
        generate_page(cfg, student_id=student_id, page_index=p)
        for p in range(cfg.page_count)
    ]


def save_sheet(
    cfg: ExamConfig,
    out_path: Union[str, Path],
    student_id: Optional[str] = None,
) -> Path:
    """Generate the first page and write it to `out_path`."""
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img = generate_sheet(cfg, student_id=student_id)
    cv2.imwrite(str(out_path), img)
    return out_path


def save_sheets(
    cfg: ExamConfig,
    out_dir: Union[str, Path],
    student_id: Optional[str] = None,
    prefix: str = "sheet",
) -> List[Path]:
    """Generate every page and write them into `out_dir`; returns the written paths."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    paths: List[Path] = []
    for page_index, img in enumerate(generate_sheets(cfg, student_id=student_id)):
        path = out_dir / f"{prefix}_p{page_index + 1}.png"
        cv2.imwrite(str(path), img)
        paths.append(path)
    return paths
