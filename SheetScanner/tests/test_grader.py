"""Round-trip tests: generate a sheet, fill known bubbles, grade, assert.

This is the project's core correctness proof -- it needs no scanner or sample image.
"""
import textwrap
from pathlib import Path

import cv2
import numpy as np
import pytest

from omr.config import load_exam_config
from omr.geometry import bubble_center, bubble_center_on_page
from omr.grader import (
    AMBIGUOUS, BLANK, CORRECT, MULTI_MARKED, WRONG,
    grade_image, grade_page, grade_warped,
)

CONFIG = Path(__file__).resolve().parents[1] / "config" / "exam_example.yaml"


@pytest.fixture
def cfg():
    return load_exam_config(CONFIG)


@pytest.fixture
def blank_sheet(cfg):
    from omr.sheet_generator import generate_sheet
    return generate_sheet(cfg, student_id="S999")


def fill(sheet, cfg, q, choice, ratio=1.0):
    """Darken a bubble. ratio<1 fills a smaller inner disc (partial mark)."""
    cx, cy = bubble_center(cfg, q, choice)
    r = max(1, int((cfg.layout.bubble_radius - 2) * ratio))
    cv2.circle(sheet, (cx, cy), r, (0, 0, 0), -1)


def test_all_correct_scores_100(cfg, blank_sheet):
    for q, key in enumerate(cfg.answer_sets):
        for ans in key:
            fill(blank_sheet, cfg, q, ans)
    result = grade_warped(blank_sheet, cfg)
    assert result.score == 100.0
    assert all(r.status == CORRECT for r in result.results)


def test_mixed_statuses(cfg, blank_sheet):
    key = [next(iter(k)) for k in cfg.answer_sets]
    fill(blank_sheet, cfg, 0, key[0])                       # correct
    wrong = (key[1] + 1) % cfg.choices_per_q
    fill(blank_sheet, cfg, 1, wrong)                        # wrong
    # q2 left blank
    fill(blank_sheet, cfg, 3, 0)                            # multiple-marked
    fill(blank_sheet, cfg, 3, 1)
    fill(blank_sheet, cfg, 4, key[4])                       # correct

    result = grade_warped(blank_sheet, cfg)
    statuses = [r.status for r in result.results]
    assert statuses[0] == CORRECT
    assert statuses[1] == WRONG
    assert statuses[2] == BLANK
    assert statuses[3] == MULTI_MARKED
    assert statuses[4] == CORRECT
    assert result.num_correct == 2
    # blank + multiple should be flagged for review
    assert {r.index for r in result.flagged} == {2, 3}


@pytest.mark.parametrize("ratios, correct, expected, selected", [
    ([0.0, 0.9, 0.0, 0.0, 0.0], {1}, CORRECT, [1]),      # clean correct mark
    ([0.9, 0.0, 0.0, 0.0, 0.0], {1}, WRONG, [0]),        # clean wrong mark
    ([0.0, 0.0, 0.0, 0.0, 0.0], {1}, BLANK, []),         # nothing marked
    ([0.0, 0.8, 0.7, 0.0, 0.0], {1}, MULTI_MARKED, [1, 2]),  # two over threshold
    ([0.0, 0.50, 0.41, 0.0, 0.0], {1}, AMBIGUOUS, [1]),  # one over, runner-up too close
])
def test_classify_logic(cfg, ratios, correct, expected, selected):
    from omr.grader import _classify
    qr = _classify(ratios, correct, cfg)
    assert qr.status == expected
    assert qr.selected == selected


# --- multiple choice -------------------------------------------------------

MULTI_CFG = """
    exam_id: EXAM-MC
    num_questions: 4
    choices_per_q: 5
    answer_key:
      - [A, C]
      - [B]
      - [A, B, D]
      - [E]
"""


@pytest.fixture
def multi_cfg(tmp_path):
    p = tmp_path / "mc.yaml"
    p.write_text(textwrap.dedent(MULTI_CFG))
    return load_exam_config(p)


def test_multi_correct_marking_all_is_correct(multi_cfg):
    """A question with 2 correct options: marking both is CORRECT, not MULTI_MARKED."""
    from omr.grader import _classify
    qr = _classify([0.9, 0.0, 0.9, 0.0, 0.0], multi_cfg.answer_sets[0], multi_cfg)
    assert qr.status == CORRECT
    assert qr.selected == [0, 2]


def test_multi_correct_marking_one_is_wrong(multi_cfg):
    """Marking only one of the two correct options is simply WRONG."""
    from omr.grader import _classify
    qr = _classify([0.9, 0.0, 0.0, 0.0, 0.0], multi_cfg.answer_sets[0], multi_cfg)
    assert qr.status == WRONG
    assert qr.selected == [0]


def test_multi_marked_only_for_single_answer_questions(multi_cfg):
    """3 marks on a 1-answer question -> MULTI_MARKED; on a 2-answer question -> WRONG."""
    from omr.grader import _classify
    single = _classify([0.9, 0.9, 0.9, 0.0, 0.0], multi_cfg.answer_sets[1], multi_cfg)
    assert single.status == MULTI_MARKED

    multi = _classify([0.9, 0.9, 0.9, 0.0, 0.0], multi_cfg.answer_sets[0], multi_cfg)
    assert multi.status == WRONG


def test_multi_answer_three_correct_options(multi_cfg):
    """A question with 3 correct options, all marked -> CORRECT."""
    from omr.grader import _classify
    qr = _classify([0.9, 0.9, 0.0, 0.9, 0.0], multi_cfg.answer_sets[2], multi_cfg)
    assert qr.status == CORRECT
    assert qr.selected == [0, 1, 3]


def test_multi_answer_partial_is_ambiguous(multi_cfg):
    """One of two correct options marked, the missing one a near-tie -> AMBIGUOUS."""
    from omr.grader import _classify
    qr = _classify([0.0, 0.50, 0.41, 0.0, 0.0], multi_cfg.answer_sets[0], multi_cfg)
    assert qr.status == AMBIGUOUS
    assert qr.selected == [1]


def test_multi_answer_sheet_round_trip(multi_cfg):
    """Full generate -> fill -> grade round trip on a multi-answer exam."""
    from omr.sheet_generator import generate_sheet
    sheet = generate_sheet(multi_cfg, student_id="S001")

    # Q1 (A,C) -> correct; Q2 (B) -> correct; Q3 (A,B,D) -> mark only A,B -> wrong;
    # Q4 (E) -> wrong
    for c in (0, 2):
        fill(sheet, multi_cfg, 0, c)
    fill(sheet, multi_cfg, 1, 1)
    for c in (0, 1):
        fill(sheet, multi_cfg, 2, c)
    fill(sheet, multi_cfg, 3, 0)

    result = grade_warped(sheet, multi_cfg)
    assert [r.status for r in result.results] == [CORRECT, CORRECT, WRONG, WRONG]
    assert result.num_correct == 2
    assert result.results[0].selected == [0, 2]
    assert result.results[0].correct_answer == [0, 2]


def test_confidence_is_populated(multi_cfg):
    from omr.grader import _classify
    qr = _classify([0.9, 0.0, 0.9, 0.0, 0.0], multi_cfg.answer_sets[0], multi_cfg)
    assert 0.0 < qr.confidence <= 1.0
    blank = _classify([0.0] * 5, multi_cfg.answer_sets[0], multi_cfg)
    assert blank.confidence == 0.0


# --- multi page ------------------------------------------------------------

MULTIPAGE_CFG = """
    exam_id: EXAM-MP
    num_questions: 20
    choices_per_q: 4
    questions_per_page: 10
    answer_key:
""" + "\n".join(["      - [A]"] * 20)


@pytest.fixture
def mp_cfg(tmp_path):
    p = tmp_path / "mp.yaml"
    p.write_text(textwrap.dedent(MULTIPAGE_CFG))
    return load_exam_config(p)


def test_multipage_config(mp_cfg):
    assert mp_cfg.questions_per_page == 10
    assert mp_cfg.page_count == 2
    assert mp_cfg.questions_on_page(0) == list(range(10))
    assert mp_cfg.questions_on_page(1) == list(range(10, 20))


def test_bubble_center_resets_row_per_page(mp_cfg):
    """Question 0 and question 10 are both at row 0 of their own page."""
    assert bubble_center(mp_cfg, 0, 0) == bubble_center_on_page(mp_cfg, 0, 0, 0)
    assert bubble_center(mp_cfg, 10, 0) == bubble_center_on_page(mp_cfg, 1, 0, 0)
    assert bubble_center(mp_cfg, 0, 0) == bubble_center(mp_cfg, 10, 0)
    # row 1 of page 1 is one row_spacing below row 0
    assert bubble_center(mp_cfg, 11, 0)[1] == bubble_center(mp_cfg, 10, 0)[1] + \
        mp_cfg.layout.row_spacing


def test_generate_sheets_returns_one_image_per_page(mp_cfg):
    from omr.sheet_generator import generate_sheets
    pages = generate_sheets(mp_cfg, student_id="S777")
    assert len(pages) == 2
    for p in pages:
        assert p.shape[:2] == (mp_cfg.layout.page_height, mp_cfg.layout.page_width)


def test_qr_carries_distinct_page_index(mp_cfg):
    from omr.identity import read_identity
    from omr.sheet_generator import generate_sheets
    pages = generate_sheets(mp_cfg, student_id="S777")
    idents = [read_identity(p) for p in pages]
    assert [i.page_index for i in idents] == [0, 1]
    assert all(i.student_id == "S777" for i in idents)
    assert all(i.exam_id == "EXAM-MP" for i in idents)


def test_grading_pages_separately_yields_global_question_indices(mp_cfg):
    """Regression: each page must be graded on its own and report global indices."""
    from omr.sheet_generator import generate_sheets
    pages = generate_sheets(mp_cfg, student_id="S777")

    # fill page 0 questions 1..10 (global indices 0..9) with A
    for q in range(10):
        fill(pages[0], mp_cfg, q, 0)
    # fill page 1 questions 11..20 (global indices 10..19) with A
    for q in range(10, 20):
        fill(pages[1], mp_cfg, q, 0)

    r0 = grade_page(pages[0], mp_cfg, page_index=0)
    r1 = grade_page(pages[1], mp_cfg, page_index=1)

    assert [r.index for r in r0.results] == list(range(10))
    assert [r.index for r in r1.results] == list(range(10, 20))
    assert all(r.is_correct for r in r0.results)
    assert all(r.is_correct for r in r1.results)
    assert r0.score == 100.0 and r1.score == 100.0


def test_multipage_merge_by_question_index(mp_cfg):
    """Merging pages is a plain union on the global question index."""
    from omr.sheet_generator import generate_sheets
    pages = generate_sheets(mp_cfg, student_id="S777")
    for q in range(20):
        fill(pages[q // 10], mp_cfg, q, 0)

    merged = {}
    for p_idx, page in enumerate(pages):
        for qr in grade_page(page, mp_cfg, page_index=p_idx).results:
            merged[qr.index] = qr

    assert sorted(merged) == list(range(20))
    assert all(qr.is_correct for qr in merged.values())


def test_grade_image_via_aruco(cfg, blank_sheet):
    # full pipeline: detector (ArUco warp) + grader, on a flat generated sheet
    for q, key in enumerate(cfg.answer_sets):
        for ans in key:
            fill(blank_sheet, cfg, q, ans)
    result = grade_image(blank_sheet, cfg, student_id="S999")
    assert result.warp_method == "aruco"
    assert result.score == 100.0
    assert result.student_id == "S999"
