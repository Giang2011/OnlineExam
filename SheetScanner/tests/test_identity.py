from pathlib import Path

from omr.config import load_exam_config
from omr.identity import read_identity
from omr.sheet_generator import generate_sheet, generate_sheets

CONFIG = Path(__file__).resolve().parents[1] / "config" / "exam_example.yaml"


def test_reads_student_and_exam_from_qr():
    cfg = load_exam_config(CONFIG)
    sheet = generate_sheet(cfg, student_id="S042")
    ident = read_identity(sheet)
    assert ident.student_id == "S042"
    assert ident.exam_id == "EXAM-101"


def test_missing_qr_returns_empty_identity():
    import numpy as np
    blank = np.full((400, 400, 3), 255, dtype=np.uint8)
    ident = read_identity(blank)
    assert ident.student_id is None
    assert ident.page_index is None


def test_single_page_qr_has_page_index_zero():
    cfg = load_exam_config(CONFIG)
    sheet = generate_sheet(cfg, student_id="S042")
    ident = read_identity(sheet)
    assert ident.page_index == 0


def test_legacy_qr_without_page_index_is_tolerated():
    """QRs generated before multi-page support must still decode."""
    import json

    import cv2
    import numpy as np
    import qrcode

    from omr.identity import _decode

    payload = json.dumps({"exam": "EXAM-101", "student": "S042"})
    qr = qrcode.QRCode(box_size=10, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    arr = np.array(qr.make_image(fill_color="black", back_color="white").convert("RGB"))[:, :, ::-1]
    img = np.full((400, 400, 3), 255, dtype=np.uint8)
    img[50:250, 50:250] = cv2.resize(arr, (200, 200), interpolation=cv2.INTER_NEAREST)

    ident = read_identity(img)
    assert ident.student_id == "S042"
    assert ident.exam_id == "EXAM-101"
    assert ident.page_index is None


def test_each_page_has_its_own_page_index():
    import textwrap

    from omr.config import load_exam_config as load

    cfg = load(
        Path(__file__).resolve().parents[1] / "config" / "exam_example.yaml"
    )
    # build a 2-page config
    raw = textwrap.dedent("""
        exam_id: EXAM-MP
        num_questions: 12
        choices_per_q: 4
        questions_per_page: 6
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
          - [A]
          - [A]
    """)
    import tempfile

    with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False) as f:
        f.write(raw)
        path = f.name
    cfg = load(path)

    pages = generate_sheets(cfg, student_id="S900")
    assert len(pages) == 2
    assert [read_identity(p).page_index for p in pages] == [0, 1]
    assert all(read_identity(p).student_id == "S900" for p in pages)
