"""Exam configuration: loading and validation.

An exam is described by a YAML file (see config/exam_example.yaml). This module
parses it into validated dataclasses so every other module can rely on the values
being sane (correct key length, in-range answers, positive layout numbers).

Answer keys are stored as *sets* of correct options per question, so a question may
have several correct answers (multiple choice). Both notations are accepted:

    answer_key: [B, [A, C], D]     # question 2 has two correct options
    answer_key: [B, E, A, D, B]    # legacy: every entry is a single option
"""
from __future__ import annotations

import string
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, FrozenSet, List, Sequence, Union

import yaml

LETTERS = string.ascii_uppercase


class ConfigError(ValueError):
    """Raised when an exam configuration is missing fields or internally inconsistent."""


@dataclass
class Layout:
    """Canonical sheet layout (pixels).

    The defaults match `config/exam_example.yaml` so that a layout-less request
    still lines up with the sheets produced by the reference configuration.
    """
    bubble_radius: int = 16
    choice_spacing: int = 64
    row_spacing: int = 56
    margin_top: int = 330
    margin_left: int = 150
    page_width: int = 850
    page_height: int = 1100
    marker_size: int = 80
    marker_margin: int = 30


@dataclass
class ExamConfig:
    exam_id: str
    num_questions: int
    choices_per_q: int
    answer_key: List[List[int]]        # per question: sorted list of 0-based correct options
    fill_threshold: float = 0.45
    ambiguity_margin: float = 0.12
    questions_per_page: int = 0        # 0 => derived from num_questions (single page)
    layout: Layout = field(default_factory=Layout)

    def __post_init__(self) -> None:
        if not self.questions_per_page:
            self.questions_per_page = self.num_questions

    def letter(self, index: int) -> str:
        """Map a 0-based choice index to its display letter (0 -> 'A')."""
        return LETTERS[index]

    def letters(self, indices: Sequence[int]) -> str:
        """Map a set of 0-based choice indices to a pipe-joined display string."""
        return "|".join(self.letter(i) for i in sorted(indices))

    @property
    def choice_letters(self) -> List[str]:
        return list(LETTERS[: self.choices_per_q])

    @property
    def answer_sets(self) -> List[FrozenSet[int]]:
        """Per question, the set of correct 0-based option indices."""
        return [frozenset(a) for a in self.answer_key]

    @property
    def page_count(self) -> int:
        """Number of pages needed to hold every question."""
        return max(1, (self.num_questions + self.questions_per_page - 1) // self.questions_per_page)

    def questions_on_page(self, page_index: int) -> List[int]:
        """Global 0-based question indices that live on `page_index` (0-based)."""
        start = page_index * self.questions_per_page
        end = min(start + self.questions_per_page, self.num_questions)
        return list(range(start, max(start, end)))


def _coerce_index(value: Union[int, str], choices_per_q: int, q_num: int) -> int:
    """Accept either a 0-based int or a letter (A, B, ...) and return a 0-based int."""
    if isinstance(value, bool):  # bool is an int subclass; reject explicitly
        raise ConfigError(f"Q{q_num}: answer must be a letter or integer, got boolean")
    if isinstance(value, int):
        idx = value
    elif isinstance(value, str) and len(value.strip()) == 1 and value.strip().upper() in LETTERS:
        idx = LETTERS.index(value.strip().upper())
    else:
        raise ConfigError(f"Q{q_num}: answer {value!r} is not a valid letter or integer")
    if not 0 <= idx < choices_per_q:
        raise ConfigError(
            f"Q{q_num}: answer {value!r} is out of range for {choices_per_q} choices"
        )
    return idx


def _coerce_answer_set(value, choices_per_q: int, q_num: int) -> List[int]:
    """Coerce one answer-key entry into a sorted list of 0-based option indices."""
    if isinstance(value, (list, tuple, set, frozenset)):
        raw_items = list(value)
        if not raw_items:
            raise ConfigError(f"Q{q_num}: answer set is empty")
        idxs = [_coerce_index(v, choices_per_q, q_num) for v in raw_items]
        if len(set(idxs)) != len(idxs):
            raise ConfigError(f"Q{q_num}: answer set {value!r} contains duplicate options")
        return sorted(set(idxs))
    return [_coerce_index(value, choices_per_q, q_num)]


def build_exam_config(raw: Dict) -> ExamConfig:
    """Validate a raw (already parsed) config mapping and build an `ExamConfig`."""
    for required in ("num_questions", "choices_per_q", "answer_key"):
        if required not in raw:
            raise ConfigError(f"Missing required field: {required!r}")

    num_questions = int(raw["num_questions"])
    choices_per_q = int(raw["choices_per_q"])
    if num_questions < 1:
        raise ConfigError("num_questions must be >= 1")
    if not 2 <= choices_per_q <= len(LETTERS):
        raise ConfigError(f"choices_per_q must be between 2 and {len(LETTERS)}")

    raw_key = raw["answer_key"]
    if not isinstance(raw_key, list):
        raise ConfigError("answer_key must be a list")
    if len(raw_key) != num_questions:
        raise ConfigError(
            f"answer_key has {len(raw_key)} entries but num_questions is {num_questions}"
        )
    answer_key = [
        _coerce_answer_set(v, choices_per_q, i + 1) for i, v in enumerate(raw_key)
    ]

    questions_per_page = int(raw.get("questions_per_page") or 0)
    if questions_per_page and questions_per_page < 1:
        raise ConfigError("questions_per_page must be >= 1")

    layout = Layout(**(raw.get("layout") or {}))

    return ExamConfig(
        exam_id=str(raw.get("exam_id", "EXAM")),
        num_questions=num_questions,
        choices_per_q=choices_per_q,
        answer_key=answer_key,
        fill_threshold=float(raw.get("fill_threshold", 0.45)),
        ambiguity_margin=float(raw.get("ambiguity_margin", 0.12)),
        questions_per_page=questions_per_page,
        layout=layout,
    )


def load_exam_config(path: Union[str, Path]) -> ExamConfig:
    """Load and validate an exam config from a YAML file."""
    path = Path(path)
    if not path.exists():
        raise ConfigError(f"Config file not found: {path}")

    raw = yaml.safe_load(path.read_text()) or {}
    return build_exam_config(raw)
