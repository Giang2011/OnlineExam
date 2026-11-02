"""Tests for the FastAPI service (SheetScanner/service/app.py).

These exercise the HTTP contract the Java backend depends on, without needing a
running server: FastAPI's TestClient drives the app in-process.
"""
import base64
import json
import sys
import textwrap
from pathlib import Path

import cv2
import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omr.geometry import bubble_center  # noqa: E402
from omr.sheet_generator import generate_sheets  # noqa: E402

fastapi_testclient = pytest.importorskip("fastapi.testclient")

from service.app import app  # noqa: E402


@pytest.fixture
def client():
    return fastapi_testclient.TestClient(app)


def _fill(sheet, cfg, q, choice):
    x, y = bubble_center(cfg, q, choice)
    cv2.circle(sheet, (x, y), cfg.layout.bubble_radius - 2, (0, 0, 0), -1)


def _png_bytes(img) -> bytes:
    ok, buf = cv2.imencode(".png", img)
    assert ok
    return buf.tobytes()


# --- /scan -----------------------------------------------------------------

def test_scan_reads_a_single_page(client):
    from omr.config import load_exam_config

    cfg = load_exam_config(ROOT / "config" / "exam_example.yaml")
    sheet = generate_sheets(cfg, student_id="S123")[0]
    # mark question 1 -> A, question 2 -> B
    _fill(sheet, cfg, 0, 0)
    _fill(sheet, cfg, 1, 1)

    resp = client.post(
        "/scan",
        data={
            "paperExamId": "7",
            "actualQuestionCount": "5",
            "choicesPerQ": "5",
            "questionsPerPage": "5",
        },
        files={"image": ("sheet.png", _png_bytes(sheet), "image/png")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["status"] == "SUCCESS"
    assert body["paperExamId"] == 7
    assert body["actualQuestionCount"] == 5
    assert body["studentId"] == "S123"
    assert body["pageIndex"] == 0
    assert len(body["recognizedAnswers"]) == 5

    first = body["recognizedAnswers"][0]
    assert first["questionIndex"] == 1
    assert first["selectedOptions"] == ["A"]
    assert first["markedCount"] == 1
    assert first["isEmpty"] is False
    assert len(first["fillRatios"]) == 5
    assert first["fillRatios"][0] > 0.6
    assert 0.0 < first["confidence"] <= 1.0

    assert body["recognizedAnswers"][1]["selectedOptions"] == ["B"]
    assert body["recognizedAnswers"][2]["isEmpty"] is True
    assert body["recognizedAnswers"][2]["selectedOptions"] == []


def test_scan_reports_multiple_selected_options(client):
    from omr.config import load_exam_config

    cfg = load_exam_config(ROOT / "config" / "exam_multianswer_example.yaml")
    sheet = generate_sheets(cfg, student_id="S456")[0]
    # question 1 has A and C correct -> mark both
    _fill(sheet, cfg, 0, 0)
    _fill(sheet, cfg, 0, 2)

    resp = client.post(
        "/scan",
        data={
            "paperExamId": "1",
            "actualQuestionCount": "6",
            "choicesPerQ": "5",
            "questionsPerPage": "6",
        },
        files={"image": ("sheet.png", _png_bytes(sheet), "image/png")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    first = body["recognizedAnswers"][0]
    assert first["selectedOptions"] == ["A", "C"]
    assert first["markedCount"] == 2


def test_scan_multi_page_uses_qr_page_index(client):
    """Each page reports its own global question range, driven by the QR."""
    from omr.config import load_exam_config

    cfg = load_exam_config(ROOT / "config" / "exam_example.yaml")
    # build a 2-page config on the fly
    raw = textwrap.dedent("""
        exam_id: EXAM-MP
        num_questions: 10
        choices_per_q: 5
        questions_per_page: 5
        answer_key:
          - [A]
          - [A]
          - [A]
          - [A]
          - [A]
          - [A]
          - [A]
          - [A]
          - [A]
          - [A]
    """)
    import tempfile

    with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as f:
        f.write(raw)
        path = f.name
    cfg = load_exam_config(path)

    pages = generate_sheets(cfg, student_id="S900")
    assert len(pages) == 2

    # upload page 1 (the second page) on its own
    resp = client.post(
        "/scan",
        data={
            "paperExamId": "1",
            "actualQuestionCount": "10",
            "choicesPerQ": "5",
            "questionsPerPage": "5",
        },
        files={"image": ("page2.png", _png_bytes(pages[1]), "image/png")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["pageIndex"] == 1
    assert body["studentId"] == "S900"
    indices = [a["questionIndex"] for a in body["recognizedAnswers"]]
    assert indices == [6, 7, 8, 9, 10]


def test_scan_falls_back_to_page_index_form_field(client):
    """When the QR carries no page index, the form field is used."""
    from omr.config import load_exam_config

    cfg = load_exam_config(ROOT / "config" / "exam_example.yaml")
    sheet = generate_sheets(cfg, student_id=None)[0]
    # blank out the QR so it cannot be read
    sheet[20:150, 350:480] = 255

    resp = client.post(
        "/scan",
        data={
            "paperExamId": "1",
            "actualQuestionCount": "5",
            "choicesPerQ": "5",
            "questionsPerPage": "5",
            "pageIndex": "3",
        },
        files={"image": ("sheet.png", _png_bytes(sheet), "image/png")},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["pageIndex"] == 3


def test_scan_unreadable_image_returns_failed_to_read(client):
    blank = np.full((300, 300, 3), 255, dtype=np.uint8)
    resp = client.post(
        "/scan",
        data={"paperExamId": "1", "actualQuestionCount": "5", "choicesPerQ": "4"},
        files={"image": ("blank.png", _png_bytes(blank), "image/png")},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "FAILED_TO_READ"
    assert body["recognizedAnswers"] == []
    assert body["errors"]


def test_scan_rejects_empty_upload(client):
    resp = client.post(
        "/scan",
        data={"paperExamId": "1", "actualQuestionCount": "5", "choicesPerQ": "4"},
        files={"image": ("empty.png", b"", "image/png")},
    )
    assert resp.status_code == 400


# --- /sheets/generate ------------------------------------------------------

def test_generate_returns_one_png_per_page(client):
    resp = client.post("/sheets/generate", json={
        "examId": "EXAM-101",
        "studentId": "S001",
        "numQuestions": 20,
        "choicesPerQ": 4,
        "questionsPerPage": 10,
    })
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["pageCount"] == 2
    assert len(body["pages"]) == 2
    assert body["questionsPerPage"] == 10

    for encoded in body["pages"]:
        data = base64.b64decode(encoded)
        img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        assert img is not None
        assert img.shape[:2] == (1100, 850)


def test_generate_accepts_a_layout_override(client):
    resp = client.post("/sheets/generate", json={
        "examId": "EXAM-101",
        "numQuestions": 5,
        "choicesPerQ": 4,
        "questionsPerPage": 5,
        "layout": {"margin_top": 300, "row_spacing": 60, "page_width": 900},
    })
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["pageCount"] == 1
    assert len(body["pages"]) == 1


def test_generate_rejects_invalid_choices(client):
    resp = client.post("/sheets/generate", json={
        "examId": "EXAM-101",
        "numQuestions": 5,
        "choicesPerQ": 1,
    })
    assert resp.status_code == 400


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
