"""Grade a warped OMR sheet.

Because the detector returns a canonical top-down page, we know exactly where every
bubble is (geometry.bubble_center) and sample it directly -- no fragile contour
matching needed. For each bubble we measure a *fill ratio* (dark pixels inside the
bubble / bubble area) and classify each question as:

  CORRECT       -- the set of marked bubbles is exactly the set of correct options
  WRONG         -- marked bubbles do not match the correct set
  BLANK         -- no bubble filled
  MULTI_MARKED  -- more than one bubble filled on a question that has a single
                   correct option (an over-mark, not a legitimate multi-answer)
  AMBIGUOUS     -- one bubble filled but a runner-up is too close to be sure, or a
                   multi-answer question where the missing correct option is a
                   near-tie (so the reading is not certain)

Questions may have *several* correct options (multiple choice). The status
semantics mirror the backend's exact-set-match grading exactly.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import FrozenSet, List, Optional, Sequence, Set, Union

import cv2
import numpy as np

from .config import ExamConfig
from .detector import locate_and_warp
from .geometry import bubble_center_on_page, page_count, row_of_question

# Question statuses
CORRECT = "CORRECT"
WRONG = "WRONG"
BLANK = "BLANK"
MULTI_MARKED = "MULTI_MARKED"
AMBIGUOUS = "AMBIGUOUS"

# Reading-only status: used when no answer key is available, so the engine can
# only report *what was marked*, never whether it was right.
READ = "READ"

# Backwards-compatible alias for the old name.
MULTIPLE = MULTI_MARKED

# Statuses that a human should review rather than trust.
REVIEW_STATUSES = {BLANK, MULTI_MARKED, AMBIGUOUS}

# Fraction of the printed bubble radius we sample, to stay inside the printed ring.
_SAMPLE_RADIUS_FRAC = 0.75

# Sentinel: "use the answer key stored in the config" (see grade_page).
_USE_CONFIG_KEY = object()


@dataclass
class QuestionResult:
    index: int                              # 0-based *global* question number
    selected: List[int]                     # sorted chosen choice indices ([] = blank)
    correct_answer: List[int]               # sorted correct choice indices
    status: str
    fill_ratios: List[float] = field(default_factory=list)
    page_index: int = 0
    confidence: float = 0.0

    @property
    def is_correct(self) -> bool:
        return self.status == CORRECT

    @property
    def needs_review(self) -> bool:
        return self.status in REVIEW_STATUSES

    @property
    def marked_count(self) -> int:
        return len(self.selected)

    @property
    def is_empty(self) -> bool:
        return not self.selected


@dataclass
class SheetResult:
    results: List[QuestionResult]
    student_id: Optional[str] = None
    warp_method: str = ""
    page_index: int = 0

    @property
    def num_correct(self) -> int:
        return sum(r.is_correct for r in self.results)

    @property
    def score(self) -> float:
        if not self.results:
            return 0.0
        return 100.0 * self.num_correct / len(self.results)

    @property
    def flagged(self) -> List[QuestionResult]:
        return [r for r in self.results if r.needs_review]


def _fill_ratio(thresh: np.ndarray, center, radius: int) -> float:
    """Fraction of pixels inside the bubble that are marked (white in `thresh`)."""
    mask = np.zeros(thresh.shape, dtype="uint8")
    cv2.circle(mask, (int(center[0]), int(center[1])), radius, 255, -1)
    area = cv2.countNonZero(mask)
    if area == 0:
        return 0.0
    marked = cv2.countNonZero(cv2.bitwise_and(thresh, thresh, mask=mask))
    return marked / float(area)


def _confidence(
    ratios: Sequence[float],
    selected: Sequence[int],
    status: str,
    cfg: ExamConfig,
) -> float:
    """How sure we are about the reading, derived from the actual fill ratios.

    * no mark       -> 0.0
    * one clean mark-> the fill ratio of that bubble
    * several marks -> the mean fill ratio of the marked bubbles
    * ambiguous     -> damped by the ambiguity margin so it stays below the level
                       a reviewer would trust
    """
    if not selected:
        return 0.0
    picked = [ratios[i] for i in selected if 0 <= i < len(ratios)]
    if not picked:
        return 0.0
    base = float(sum(picked)) / len(picked)
    if status == AMBIGUOUS:
        base -= cfg.ambiguity_margin
    return round(max(0.0, min(1.0, base)), 4)


def _classify(
    ratios: Sequence[float],
    correct: Union[FrozenSet[int], Set[int], Sequence[int], None],
    cfg: ExamConfig,
) -> QuestionResult:
    """Classify one question from its per-choice fill ratios.

    `correct` is the set of correct option indices for the question (one or more).
    When it is `None` the engine works in reading-only mode: it reports what was
    marked (and whether the reading is ambiguous) but never whether it was right.
    """
    ratios = list(ratios)

    filled = {i for i, r in enumerate(ratios) if r >= cfg.fill_threshold}
    best = max(range(len(ratios)), key=lambda i: ratios[i]) if ratios else 0
    top = ratios[best] if ratios else 0.0
    contested = {i for i, r in enumerate(ratios) if r >= top - cfg.ambiguity_margin} - {best}

    selected = sorted(filled)

    if correct is None:
        correct_set: FrozenSet[int] = frozenset()
        if not filled:
            status = BLANK
        elif len(filled) == 1 and contested:
            status = AMBIGUOUS
        elif len(filled) > 1:
            status = MULTI_MARKED
        else:
            status = READ
    else:
        correct_set = frozenset(correct)
        missing = correct_set - filled

        if not filled:
            status = BLANK
        elif len(filled) == 1 and contested:
            # a runner-up bubble is nearly as dark -> we cannot be sure which one was meant
            status = AMBIGUOUS
        elif filled == correct_set:
            status = CORRECT
        elif len(correct_set) == 1 and len(filled) > 1:
            # Over-marked: the question has a single correct option but extra bubbles
            # were filled. Only meaningful for single-answer questions.
            status = MULTI_MARKED
        elif missing and missing <= contested:
            # Multi-answer question where the correct option the student left blank is a
            # near-tie -> the reading is uncertain, not plainly wrong.
            status = AMBIGUOUS
        else:
            status = WRONG

    return QuestionResult(
        index=-1,
        selected=selected,
        correct_answer=sorted(correct_set),
        status=status,
        fill_ratios=ratios,
        confidence=_confidence(ratios, selected, status, cfg),
    )


def grade_page(
    warped: np.ndarray,
    cfg: ExamConfig,
    page_index: int = 0,
    warp_method: str = "",
    answer_key: Optional[Sequence[Sequence[int]]] = _USE_CONFIG_KEY,
) -> SheetResult:
    """Grade a single canonical page of a multi-page exam.

    The returned `QuestionResult.index` values are *global* 0-based question indices
    (``page_index * questions_per_page + row``), so pages can be merged by a simple
    union on the question index.

    `answer_key` overrides the key stored in `cfg`; the default is to use the key
    from `cfg`. Passing an empty list puts the engine in reading-only mode (no key
    -> no correctness judgement, only "what was marked").
    """
    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY) if warped.ndim == 3 else warped
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    radius = max(1, int(cfg.layout.bubble_radius * _SAMPLE_RADIUS_FRAC))

    if answer_key is _USE_CONFIG_KEY:
        key = cfg.answer_key
    else:
        key = list(answer_key)

    questions = cfg.questions_on_page(page_index)

    results: List[QuestionResult] = []
    for q in questions:
        row = row_of_question(cfg, q)
        ratios = [
            _fill_ratio(thresh, bubble_center_on_page(cfg, page_index, row, c), radius)
            for c in range(cfg.choices_per_q)
        ]
        correct = key[q] if key and q < len(key) else None
        qr = _classify(ratios, correct, cfg)
        qr.index = q
        qr.page_index = page_index
        results.append(qr)

    return SheetResult(results=results, warp_method=warp_method, page_index=page_index)


def grade_warped(
    warped: np.ndarray,
    cfg: ExamConfig,
    warp_method: str = "",
    page_index: int = 0,
) -> SheetResult:
    """Grade an already-warped canonical page (page 0 by default)."""
    return grade_page(warped, cfg, page_index=page_index, warp_method=warp_method)


def grade_image(
    image: np.ndarray,
    cfg: ExamConfig,
    student_id: Optional[str] = None,
    page_index: int = 0,
) -> SheetResult:
    """Locate, warp and grade a raw sheet image."""
    warp = locate_and_warp(image, cfg)
    result = grade_page(warp.warped, cfg, page_index=page_index, warp_method=warp.method)
    result.student_id = student_id
    return result


# --- annotation -------------------------------------------------------------
_GREEN = (0, 170, 0)
_RED = (0, 0, 255)
_YELLOW = (0, 200, 255)


def annotate(warped: np.ndarray, result: SheetResult, cfg: ExamConfig) -> np.ndarray:
    """Draw grading feedback on a copy of the warped page."""
    out = warped.copy() if warped.ndim == 3 else cv2.cvtColor(warped, cv2.COLOR_GRAY2BGR)
    r = cfg.layout.bubble_radius

    for qr in result.results:
        row = row_of_question(cfg, qr.index)
        # always mark every correct answer in green
        for correct in qr.correct_answer:
            cx, cy = bubble_center_on_page(cfg, qr.page_index, row, correct)
            cv2.circle(out, (cx, cy), r + 3, _GREEN, 2)

        if qr.status == WRONG:
            for sel in qr.selected:
                sx, sy = bubble_center_on_page(cfg, qr.page_index, row, sel)
                cv2.circle(out, (sx, sy), r + 3, _RED, 2)
        elif qr.needs_review:
            # flag the row for human review, to the right of the last bubble
            fx = cfg.layout.margin_left + cfg.choices_per_q * cfg.layout.choice_spacing
            cv2.putText(out, qr.status, (fx, cy + 6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, _YELLOW, 2)

    cv2.putText(out, f"Score: {result.score:.1f}%", (cfg.layout.page_width - 260, 218),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, _RED, 2)
    return out
