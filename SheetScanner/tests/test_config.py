import textwrap
from pathlib import Path

import pytest

from omr.config import ConfigError, load_exam_config


def _write(tmp_path: Path, body: str) -> Path:
    p = tmp_path / "exam.yaml"
    p.write_text(textwrap.dedent(body))
    return p


def test_loads_example_config():
    cfg = load_exam_config(Path(__file__).resolve().parents[1] / "config" / "exam_example.yaml")
    assert cfg.num_questions == 5
    assert cfg.choices_per_q == 5
    # letters B, E, A, D, B -> 0-based indices, each stored as a one-element set
    assert cfg.answer_key == [[1], [4], [0], [3], [1]]
    assert cfg.answer_sets == [frozenset({1}), frozenset({4}), frozenset({0}),
                               frozenset({3}), frozenset({1})]
    assert cfg.choice_letters == ["A", "B", "C", "D", "E"]


def test_accepts_integer_keys(tmp_path):
    cfg = load_exam_config(_write(tmp_path, """
        num_questions: 3
        choices_per_q: 4
        answer_key: [0, 3, 2]
    """))
    assert cfg.answer_key == [[0], [3], [2]]


def test_accepts_nested_answer_sets(tmp_path):
    """Several correct options per question are supported."""
    cfg = load_exam_config(_write(tmp_path, """
        num_questions: 3
        choices_per_q: 5
        answer_key: [B, [A, C], D]
    """))
    assert cfg.answer_key == [[1], [0, 2], [3]]
    assert cfg.answer_sets[1] == frozenset({0, 2})


def test_accepts_mixed_nested_and_scalar(tmp_path):
    cfg = load_exam_config(_write(tmp_path, """
        num_questions: 4
        choices_per_q: 5
        answer_key:
          - B
          - [A, C]
          - [3, 4]
          - E
    """))
    assert cfg.answer_key == [[1], [0, 2], [3, 4], [4]]


def test_answer_set_is_sorted(tmp_path):
    cfg = load_exam_config(_write(tmp_path, """
        num_questions: 1
        choices_per_q: 5
        answer_key: [[C, A]]
    """))
    assert cfg.answer_key == [[0, 2]]


def test_rejects_empty_answer_set(tmp_path):
    with pytest.raises(ConfigError, match="empty"):
        load_exam_config(_write(tmp_path, """
            num_questions: 2
            choices_per_q: 4
            answer_key: [0, []]
        """))


def test_rejects_duplicate_options_in_set(tmp_path):
    with pytest.raises(ConfigError, match="duplicate"):
        load_exam_config(_write(tmp_path, """
            num_questions: 1
            choices_per_q: 4
            answer_key: [[A, A]]
        """))


def test_rejects_key_length_mismatch(tmp_path):
    with pytest.raises(ConfigError, match="answer_key has"):
        load_exam_config(_write(tmp_path, """
            num_questions: 3
            choices_per_q: 4
            answer_key: [0, 1]
        """))


def test_rejects_out_of_range_answer(tmp_path):
    with pytest.raises(ConfigError, match="out of range"):
        load_exam_config(_write(tmp_path, """
            num_questions: 2
            choices_per_q: 4
            answer_key: [0, E]
        """))


def test_rejects_out_of_range_answer_in_set(tmp_path):
    with pytest.raises(ConfigError, match="out of range"):
        load_exam_config(_write(tmp_path, """
            num_questions: 1
            choices_per_q: 4
            answer_key: [[0, 9]]
        """))


def test_rejects_missing_field(tmp_path):
    with pytest.raises(ConfigError, match="answer_key"):
        load_exam_config(_write(tmp_path, """
            num_questions: 2
            choices_per_q: 4
        """))


def test_questions_per_page_defaults_to_num_questions(tmp_path):
    cfg = load_exam_config(_write(tmp_path, """
        num_questions: 7
        choices_per_q: 4
        answer_key: [0, 1, 2, 3, 0, 1, 2]
    """))
    assert cfg.questions_per_page == 7
    assert cfg.page_count == 1
    assert cfg.questions_on_page(0) == list(range(7))


def test_questions_per_page_splits_pages(tmp_path):
    cfg = load_exam_config(_write(tmp_path, """
        num_questions: 7
        choices_per_q: 4
        questions_per_page: 3
        answer_key: [0, 1, 2, 3, 0, 1, 2]
    """))
    assert cfg.questions_per_page == 3
    assert cfg.page_count == 3
    assert cfg.questions_on_page(0) == [0, 1, 2]
    assert cfg.questions_on_page(1) == [3, 4, 5]
    assert cfg.questions_on_page(2) == [6]
