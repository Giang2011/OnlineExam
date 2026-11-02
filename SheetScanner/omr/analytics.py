"""Aggregate graded sheets into a CSV, item-analysis stats, and a score histogram.

This is what turns the project from "grade one image" into an assessment tool:
per-student results plus per-question difficulty and distractor analysis.
"""
from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import List, Union

import pandas as pd

from .config import ExamConfig
from .grader import AMBIGUOUS, BLANK, MULTI_MARKED, SheetResult


def results_dataframe(results: List[SheetResult], cfg: ExamConfig) -> pd.DataFrame:
    """One row per graded sheet: id, score, flags, and per-question answers."""
    rows = []
    for res in results:
        row = {
            "student_id": res.student_id or "",
            "score": round(res.score, 1),
            "num_correct": res.num_correct,
            "num_questions": len(res.results),
            "flagged": len(res.flagged),
            "warp_method": res.warp_method,
        }
        for qr in res.results:
            # a question may have several marked options -> "A|C"
            row[f"Q{qr.index + 1}"] = cfg.letters(qr.selected) if qr.selected else qr.status
        rows.append(row)
    return pd.DataFrame(rows)


def item_analysis(results: List[SheetResult], cfg: ExamConfig) -> pd.DataFrame:
    """Per-question difficulty and distractor analysis across all sheets."""
    n = len(results)
    rows = []
    for q in range(cfg.num_questions):
        qrs = [res.results[q] for res in results if q < len(res.results)]
        correct_set = set(cfg.answer_sets[q])
        correct = sum(r.is_correct for r in qrs)
        blank = sum(r.status == BLANK for r in qrs)
        multiple = sum(r.status == MULTI_MARKED for r in qrs)
        ambiguous = sum(r.status == AMBIGUOUS for r in qrs)

        # most-chosen wrong option (distractor analysis): count each *option*
        # separately, since a question may have several marked options
        wrong_counter: Counter = Counter()
        for r in qrs:
            for choice in r.selected:
                if choice not in correct_set:
                    wrong_counter[choice] += 1
        if wrong_counter:
            top_choice, _ = wrong_counter.most_common(1)[0]
            distractor = cfg.letter(top_choice)
        else:
            distractor = ""

        rows.append({
            "question": q + 1,
            "correct_answer": cfg.letters(correct_set),
            "pct_correct": round(100.0 * correct / n, 1) if n else 0.0,
            "n_blank": blank,
            "n_multi_marked": multiple,
            "n_ambiguous": ambiguous,
            "top_distractor": distractor,
        })
    return pd.DataFrame(rows)


def save_reports(
    results: List[SheetResult],
    cfg: ExamConfig,
    out_dir: Union[str, Path],
) -> dict:
    """Write results.csv, item_analysis.csv and score_distribution.png. Returns paths."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    results_df = results_dataframe(results, cfg)
    items_df = item_analysis(results, cfg)

    results_path = out_dir / "results.csv"
    items_path = out_dir / "item_analysis.csv"
    hist_path = out_dir / "score_distribution.png"

    results_df.to_csv(results_path, index=False)
    items_df.to_csv(items_path, index=False)
    _save_histogram(results_df["score"].tolist(), hist_path)

    return {"results": results_path, "item_analysis": items_path, "histogram": hist_path}


def _save_histogram(scores: List[float], path: Path) -> None:
    import matplotlib
    matplotlib.use("Agg")  # headless / no display needed
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(6, 4))
    ax.hist(scores, bins=range(0, 110, 10), edgecolor="black", color="#4C72B0")
    ax.set_xlabel("Score (%)")
    ax.set_ylabel("Students")
    ax.set_title("Score distribution")
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
