"""Self-contained accuracy evaluation.

Generates N sheets with random known answers (including blanks and double-marks),
optionally distorts them with perspective + noise to mimic phone photos, grades them,
and reports per-question accuracy against ground truth. No scanner required.

Questions whose answer key holds several options are exercised too: the ground
truth for such a question is the *set* of marked options, so recall of multi-answer
questions is measured separately.

    python scripts/evaluate.py --n 200 --distort
"""
from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from omr.config import load_exam_config  # noqa: E402
from omr.geometry import bubble_center  # noqa: E402
from omr.grader import BLANK, MULTI_MARKED, WRONG, grade_image  # noqa: E402
from omr.sheet_generator import generate_sheet  # noqa: E402

CONFIG = Path(__file__).resolve().parents[1] / "config" / "exam_example.yaml"


def _fill(sheet, cfg, q, c):
    x, y = bubble_center(cfg, q, c)
    cv2.circle(sheet, (x, y), cfg.layout.bubble_radius - 2, (0, 0, 0), -1)


def _distort(img, rng):
    """Random perspective warp + Gaussian noise to imitate a phone photo."""
    h, w = img.shape[:2]
    pad = 120
    canvas = np.full((h + 2 * pad, w + 2 * pad, 3), 235, np.uint8)
    canvas[pad:pad + h, pad:pad + w] = img
    src = np.float32([[pad, pad], [pad + w, pad], [pad + w, pad + h], [pad, pad + h]])
    j = lambda: rng.uniform(-60, 60)  # noqa: E731
    dst = src + np.float32([[j(), j()], [j(), j()], [j(), j()], [j(), j()]])
    M = cv2.getPerspectiveTransform(src, dst)
    out = cv2.warpPerspective(canvas, M, (w + 2 * pad, h + 2 * pad), borderValue=(235, 235, 235))
    noise = rng.normal(0, 8, out.shape).astype(np.int16)
    return np.clip(out.astype(np.int16) + noise, 0, 255).astype(np.uint8)


def _make_ground_truth(rng, cfg, q, key):
    """Return (truth, choices_to_fill) for one question.

    `key` is the set of correct options for the question. For a multi-answer
    question the student sometimes marks only part of it (a recall miss).
    """
    multi = len(key) > 1
    r = rng.random()
    if r < 0.75:                                  # correct
        if multi and rng.random() < 0.15:
            # partial answer -> only part of the correct set is marked.
            # Per the grading rules this is simply WRONG (an incomplete answer),
            # not a review case.
            partial = sorted(key)[: max(1, len(key) - 1)]
            return ("SET", partial)
        return ("SET", sorted(key))
    if r < 0.90:                                  # wrong
        wrong_pool = [c for c in range(cfg.choices_per_q) if c not in key]
        if not wrong_pool:
            return ("SET", sorted(key))
        c = rng.choice(wrong_pool)
        return ("SET", [c])
    if r < 0.96:                                  # blank
        return ("BLANK", [])
    # double mark (over-mark on a single-answer question)
    c1 = sorted(key)[0]
    others = [c for c in range(cfg.choices_per_q) if c != c1]
    if not others:
        return ("SET", [c1])
    c2 = rng.choice(others)
    if multi:
        # a multi-answer question marked with one extra option -> plainly wrong
        return ("SET", sorted(set(list(key) + [c2])))
    return ("MULTI_MARKED", [c1, c2])


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=100, help="number of sheets")
    ap.add_argument("--distort", action="store_true", help="simulate phone-photo distortion")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--config", default=str(CONFIG), help="exam config YAML")
    args = ap.parse_args(argv)

    cfg = load_exam_config(args.config)
    rng = random.Random(args.seed)
    nprng = np.random.default_rng(args.seed)

    total_q = correct_q = 0
    review_truth = review_pred = review_hit = 0
    multi_q = multi_hit = 0
    sheets_found = 0

    for _ in range(args.n):
        sheet = generate_sheet(cfg, student_id=f"S{rng.randint(0, 9999):04d}")
        truth = []
        for q, key in enumerate(cfg.answer_sets):
            kind, choices = _make_ground_truth(rng, cfg, q, key)
            for c in choices:
                _fill(sheet, cfg, q, c)
            truth.append((kind, choices))

        img = _distort(sheet, nprng) if args.distort else sheet
        try:
            result = grade_image(img, cfg)
        except Exception:
            continue
        sheets_found += 1

        for q, qr in enumerate(result.results):
            total_q += 1
            kind, choices = truth[q]
            if kind == "BLANK":
                review_truth += 1
                if qr.needs_review:
                    review_hit += 1
                pred_ok = (qr.status == BLANK)
            elif kind == "MULTI_MARKED":
                review_truth += 1
                if qr.needs_review:
                    review_hit += 1
                pred_ok = (qr.status == MULTI_MARKED)
            elif kind == "PARTIAL":
                # a partially answered multi-answer question is simply wrong
                pred_ok = (qr.status == WRONG)
            else:
                pred_ok = (qr.selected == sorted(choices) and not qr.needs_review)
                if len(choices) > 1:
                    multi_q += 1
                    if pred_ok:
                        multi_hit += 1
            if qr.needs_review:
                review_pred += 1
            if pred_ok:
                correct_q += 1

    print(f"Sheets located/graded : {sheets_found}/{args.n}"
          f"  ({'distorted' if args.distort else 'flat'})")
    print(f"Per-question accuracy : {100.0 * correct_q / total_q:.2f}%  "
          f"({correct_q}/{total_q})")
    if review_truth:
        print(f"Review-flag recall    : {100.0 * review_hit / review_truth:.2f}%  "
              f"({review_hit}/{review_truth} flagged)")
    if multi_q:
        print(f"Multi-answer recall   : {100.0 * multi_hit / multi_q:.2f}%  "
              f"({multi_hit}/{multi_q} correct)")


if __name__ == "__main__":
    main()
