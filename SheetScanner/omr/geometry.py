"""Shared sheet geometry.

The generator draws bubbles and markers at these coordinates, the detector warps
a photographed sheet back to this exact canonical page, and the grader reads bubbles
from these same coordinates. Keeping the math in one place guarantees they agree.

The page coordinate system is simply the generated page: (0, 0) top-left, size
(layout.page_width, layout.page_height).

Multi-page support
------------------
A sheet may be longer than one canonical page. Every question has a *global*
index (0-based, across the whole exam); it lives on page ``q // questions_per_page``
at row ``q % questions_per_page``. Bubbles are always laid out relative to the
top of their own page, so each page has the same geometry.
"""
from __future__ import annotations

from typing import List, Tuple

import numpy as np

from .config import ExamConfig

# ArUco marker IDs by corner, in clockwise order from top-left.
MARKER_IDS = {"tl": 0, "tr": 1, "br": 2, "bl": 3}
# Order used everywhere a 4-point quad is needed: TL, TR, BR, BL.
CORNER_ORDER = ("tl", "tr", "br", "bl")


def page_count(cfg: ExamConfig) -> int:
    """Number of canonical pages needed to hold every question of the exam."""
    return cfg.page_count


def page_of_question(cfg: ExamConfig, q: int) -> int:
    """0-based page index holding global question `q`."""
    return q // cfg.questions_per_page


def row_of_question(cfg: ExamConfig, q: int) -> int:
    """0-based row index of global question `q` within its page."""
    return q % cfg.questions_per_page


def bubble_center(cfg: ExamConfig, q: int, choice: int) -> Tuple[int, int]:
    """Center (x, y) in canonical page pixels of the bubble for question `q`, choice `choice`.

    `q` is the *global* 0-based question index; the function resolves which page and
    row it belongs to.
    """
    lay = cfg.layout
    x = lay.margin_left + choice * lay.choice_spacing
    y = lay.margin_top + row_of_question(cfg, q) * lay.row_spacing
    return x, y


def bubble_center_on_page(cfg: ExamConfig, page_index: int, row: int, choice: int) -> Tuple[int, int]:
    """Center (x, y) of a bubble by explicit page index and row within that page."""
    lay = cfg.layout
    x = lay.margin_left + choice * lay.choice_spacing
    y = lay.margin_top + row * lay.row_spacing
    return x, y


def marker_centers(cfg: ExamConfig) -> dict:
    """Center (x, y) of each corner ArUco marker, keyed 'tl'/'tr'/'br'/'bl'."""
    lay = cfg.layout
    half = lay.marker_size / 2.0
    near = lay.marker_margin + half
    right = lay.page_width - lay.marker_margin - half
    bottom = lay.page_height - lay.marker_margin - half
    return {
        "tl": (near, near),
        "tr": (right, near),
        "br": (right, bottom),
        "bl": (near, bottom),
    }


def marker_reference_quad(cfg: ExamConfig) -> np.ndarray:
    """Marker centers as a (4, 2) float32 array in TL, TR, BR, BL order."""
    centers = marker_centers(cfg)
    return np.array([centers[c] for c in CORNER_ORDER], dtype="float32")


def all_bubble_centers(cfg: ExamConfig) -> List[List[Tuple[int, int]]]:
    """Nested list: per question, the (x, y) center of every choice bubble."""
    return [
        [bubble_center(cfg, q, c) for c in range(cfg.choices_per_q)]
        for q in range(cfg.num_questions)
    ]
