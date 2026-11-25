"""FastAPI service exposing SheetScanner to the Java backend.

Two endpoints:

  POST /scan           read one page of an answer sheet (image in, marked options out)
  POST /sheets/generate  render the printable OMR answer sheet pages (PNG out)

The service **only reads images**. It never grades: it reports *what was marked*,
the fill ratios behind that decision and a confidence, and the Java backend performs
the exact-set-match against the answer key.

Run with:

    uvicorn service.app:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import base64
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field as PydanticField

# allow running as `python service/app.py` from the repository root
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from omr.config import ExamConfig, Layout  # noqa: E402
from omr.detector import SheetNotFoundError, locate_and_warp  # noqa: E402
from omr.grader import annotate, grade_page  # noqa: E402
from omr.identity import read_identity  # noqa: E402
from omr.sheet_generator import generate_sheets  # noqa: E402

app = FastAPI(title="SheetScanner OMR service", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Scan status values, mirrored by the Java enum VisionScanStatus.
STATUS_SUCCESS = "SUCCESS"
STATUS_FAILED_TO_READ = "FAILED_TO_READ"
STATUS_NEEDS_REVIEW = "NEEDS_REVIEW"
STATUS_TIMEOUT = "TIMEOUT"
STATUS_INVALID_IMAGE = "INVALID_IMAGE"
STATUS_SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"

# Question-level statuses reported per question.
STATUS_BLANK = "BLANK"
STATUS_MULTI_MARKED = "MULTI_MARKED"
STATUS_AMBIGUOUS = "AMBIGUOUS"
STATUS_READ = "READ"

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


# --- schemas ---------------------------------------------------------------

class RecognizedAnswer(BaseModel):
    questionIndex: int
    selectedOptions: List[str] = PydanticField(default_factory=list)
    isEmpty: bool = False
    confidence: float = 0.0
    markedCount: int = 0
    fillRatios: List[float] = PydanticField(default_factory=list)
    status: str = STATUS_READ
    pageIndex: int = 0


class ScanResponse(BaseModel):
    status: str
    paperExamId: int
    actualQuestionCount: int
    studentId: Optional[str] = None
    examId: Optional[str] = None
    pageIndex: Optional[int] = None
    warpMethod: Optional[str] = None
    recognizedAnswers: List[RecognizedAnswer] = PydanticField(default_factory=list)
    annotatedImage: Optional[str] = None      # base64 PNG, page annotated with key/marks
    rawOutput: Optional[str] = None
    errors: List[str] = PydanticField(default_factory=list)


class GenerateRequest(BaseModel):
    examId: str = "EXAM"
    studentId: Optional[str] = None
    numQuestions: int = 1
    choicesPerQ: int = 4
    questionsPerPage: Optional[int] = None
    layout: Optional[Dict[str, Any]] = None
    fillThreshold: float = 0.45
    ambiguityMargin: float = 0.12


class GenerateResponse(BaseModel):
    examId: str
    studentId: Optional[str] = None
    numQuestions: int
    choicesPerQ: int
    questionsPerPage: int
    pageCount: int
    pages: List[str] = PydanticField(default_factory=list)   # base64 PNG, one per page


# --- helpers ---------------------------------------------------------------

def _build_layout(raw: Optional[Dict[str, Any]]) -> Layout:
    """Build a Layout from a JSON object, ignoring unknown keys."""
    if not raw:
        return Layout()
    fields = {f for f in Layout.__dataclass_fields__}  # type: ignore[attr-defined]
    return Layout(**{k: v for k, v in raw.items() if k in fields})


def _build_config(
    num_questions: int,
    choices_per_q: int,
    questions_per_page: Optional[int],
    layout: Optional[Dict[str, Any]],
    exam_id: str = "EXAM",
    fill_threshold: float = 0.45,
    ambiguity_margin: float = 0.12,
) -> ExamConfig:
    """Build a *reading-only* config: no answer key, so the engine never grades."""
    if num_questions < 1:
        raise ValueError("numQuestions must be >= 1")
    if not 2 <= choices_per_q <= len(LETTERS):
        raise ValueError(f"choicesPerQ must be between 2 and {len(LETTERS)}")
    qpp = questions_per_page or num_questions
    if qpp < 1:
        raise ValueError("questionsPerPage must be >= 1")

    cfg = ExamConfig(
        exam_id=exam_id,
        num_questions=num_questions,
        choices_per_q=choices_per_q,
        answer_key=[],
        fill_threshold=fill_threshold,
        ambiguity_margin=ambiguity_margin,
        questions_per_page=qpp,
        layout=_build_layout(layout),
    )
    return cfg


def _decode_image(data: bytes) -> Optional[np.ndarray]:
    arr = np.frombuffer(data, dtype=np.uint8)
    if arr.size == 0:
        return None
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _letter(index: int) -> str:
    return LETTERS[index]


def _parse_answer_key(raw: Optional[str], choices_per_q: int) -> List[List[int]]:
    """Parse the `answerKey` form field into 0-based option indices per question.

    The field is a JSON string holding a list of lists of letters, e.g.
    ``[["B"], ["A", "C"]]`` — one entry per question, in exam order. The backend
    owns the key (it lives in its own answer snapshot), so this only translates
    letters into indices; the engine still decides nothing about correctness.

    Raises ValueError on malformed input so the caller can fall back to
    read-only mode instead of failing the whole request.
    """
    if not raw:
        return []
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError("answerKey was not valid JSON") from exc
    if not isinstance(payload, list):
        raise ValueError("answerKey must be a JSON list")

    key: List[List[int]] = []
    for q, entry in enumerate(payload):
        if not isinstance(entry, list):
            raise ValueError(f"answerKey[{q}] must be a list of letters")
        options: List[int] = []
        for letter in entry:
            if not isinstance(letter, str) or len(letter.strip()) != 1:
                raise ValueError(f"answerKey[{q}] contains an invalid letter: {letter!r}")
            idx = LETTERS.find(letter.strip().upper())
            if idx < 0 or idx >= choices_per_q:
                raise ValueError(
                    f"answerKey[{q}] letter {letter!r} is out of range for "
                    f"{choices_per_q} choices"
                )
            options.append(idx)
        key.append(sorted(set(options)))
    return key


def _parse_thresholds(raw: Optional[str]) -> Dict[str, float]:
    """Parse the `thresholds` form field into the fill/ambiguity parameters.

    The backend sends the thresholds it uses so both sides agree on what counts
    as a filled bubble; the engine keeps no thresholds of its own.
    """
    if not raw:
        return {}
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError("thresholds was not valid JSON") from exc
    if not isinstance(payload, dict):
        raise ValueError("thresholds must be a JSON object")

    parsed: Dict[str, float] = {}
    for name in ("fillThreshold", "ambiguityMargin"):
        if name not in payload:
            continue
        value = payload[name]
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"thresholds.{name} must be a number")
        parsed[name] = float(value)
    return parsed


def _encode_png(image: np.ndarray) -> Optional[str]:
    """Encode an image as base64 PNG, or None if encoding fails."""
    ok, buf = cv2.imencode(".png", image)
    if not ok:
        return None
    return base64.b64encode(buf.tobytes()).decode("ascii")


# --- endpoints -------------------------------------------------------------

@app.get("/health")
def health() -> Dict[str, str]:
    """Simple liveness probe used by the backend and by docker-compose."""
    return {"status": "ok"}


@app.post("/scan", response_model=ScanResponse)
async def scan(
    paperExamId: int = Form(...),
    actualQuestionCount: int = Form(...),
    image: UploadFile = File(...),
    choicesPerQ: int = Form(4),
    questionsPerPage: Optional[int] = Form(None),
    pageIndex: Optional[int] = Form(None),
    layout: Optional[str] = Form(None),
    answerKey: Optional[str] = Form(None),
    thresholds: Optional[str] = Form(None),
    debug: bool = Form(False),
):
    """Read one page of an answer sheet.

    The page's own QR code is decoded from the image, so the service knows which
    page it is looking at even when the pages are uploaded out of order. The
    `pageIndex` form field is only a fallback for when the QR cannot be read.

    `answerKey` is optional. When present it carries the correct options per
    question (as letters) so the page can be rendered with the key highlighted;
    the engine still only *measures* the sheet — the backend remains the source
    of truth for every grading decision. When absent the service stays in
    read-only mode and returns no annotated image.
    """
    errors: List[str] = []

    if not image.filename:
        raise HTTPException(status_code=400, detail="Missing image filename")

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload")

    image = _decode_image(image_bytes)  # type: ignore[assignment]
    if image is None:
        raise HTTPException(status_code=400, detail="Unreadable image upload")

    # --- layout ---
    layout_obj: Optional[Dict[str, Any]] = None
    if layout:
        try:
            layout_obj = json.loads(layout)
        except json.JSONDecodeError:
            errors.append("layout was not valid JSON; using the default layout")
            layout_obj = None

    # --- answer key + thresholds (both optional, both owned by the backend) ---
    key: List[List[int]] = []
    if answerKey:
        try:
            key = _parse_answer_key(answerKey, choicesPerQ)
        except ValueError as exc:
            errors.append(f"{exc}; falling back to read-only mode")
            key = []

    threshold_values: Dict[str, float] = {}
    if thresholds:
        try:
            threshold_values = _parse_thresholds(thresholds)
        except ValueError as exc:
            errors.append(f"{exc}; using the default thresholds")
            threshold_values = {}

    qpp = questionsPerPage or actualQuestionCount

    try:
        cfg = _build_config(
            num_questions=actualQuestionCount,
            choices_per_q=choicesPerQ,
            questions_per_page=qpp,
            layout=layout_obj,
            fill_threshold=threshold_values.get("fillThreshold", 0.45),
            ambiguity_margin=threshold_values.get("ambiguityMargin", 0.12),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # --- locate & warp (each page is warped on its own) ---
    try:
        warp = locate_and_warp(image, cfg)
    except SheetNotFoundError as exc:
        return ScanResponse(
            status=STATUS_FAILED_TO_READ,
            paperExamId=paperExamId,
            actualQuestionCount=actualQuestionCount,
            recognizedAnswers=[],
            errors=[str(exc)],
        )

    # --- identity: the QR tells us which page this is ---
    ident = read_identity(warp.warped)
    if ident.student_id is None and ident.exam_id is None:
        ident = read_identity(image)

    resolved_page_index = ident.page_index
    if resolved_page_index is None:
        resolved_page_index = pageIndex if pageIndex is not None else 0
    else:
        if pageIndex is not None and pageIndex != resolved_page_index:
            errors.append(
                f"QR page_index {resolved_page_index} differs from the requested "
                f"page {pageIndex}; the QR wins"
            )

    # --- read the bubbles of THIS page ---
    result = grade_page(
        warp.warped,
        cfg,
        page_index=resolved_page_index,
        warp_method=warp.method,
        answer_key=key,   # empty => read-only, the backend does the grading
    )

    recognized: List[RecognizedAnswer] = []
    for qr in result.results:
        recognized.append(RecognizedAnswer(
            questionIndex=qr.index + 1,          # global, 1-based
            selectedOptions=[_letter(i) for i in qr.selected],
            isEmpty=qr.is_empty,
            confidence=qr.confidence,
            markedCount=qr.marked_count,
            fillRatios=[round(r, 4) for r in qr.fill_ratios],
            status=qr.status,
            pageIndex=resolved_page_index,
        ))

    status = STATUS_SUCCESS
    if any(a.status == STATUS_AMBIGUOUS for a in recognized):
        status = STATUS_NEEDS_REVIEW

    # --- annotated page (only possible when the key is known) ---
    annotated_image = None
    if key:
        annotated_image = _encode_png(annotate(warp.warped, result, cfg))
        if annotated_image is None:
            errors.append("Failed to encode the annotated page")

    raw_output = None
    if debug:
        raw_output = json.dumps({
            "warpMethod": warp.method,
            "pageIndex": resolved_page_index,
            "examId": ident.exam_id,
            "studentId": ident.student_id,
            "qrRaw": ident.raw,
        })

    return ScanResponse(
        status=status,
        paperExamId=paperExamId,
        actualQuestionCount=actualQuestionCount,
        studentId=ident.student_id,
        examId=ident.exam_id,
        pageIndex=resolved_page_index,
        warpMethod=warp.method,
        recognizedAnswers=recognized,
        annotatedImage=annotated_image,
        rawOutput=raw_output,
        errors=errors,
    )


@app.post("/sheets/generate", response_model=GenerateResponse)
def sheets_generate(request: GenerateRequest) -> GenerateResponse:
    """Render the printable OMR answer sheet; one base64 PNG per page."""
    try:
        cfg = _build_config(
            num_questions=request.numQuestions,
            choices_per_q=request.choicesPerQ,
            questions_per_page=request.questionsPerPage,
            layout=request.layout,
            exam_id=request.examId,
            fill_threshold=request.fillThreshold,
            ambiguity_margin=request.ambiguityMargin,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    pages = generate_sheets(cfg, student_id=request.studentId)

    encoded: List[str] = []
    for img in pages:
        ok, buf = cv2.imencode(".png", img)
        if not ok:
            raise HTTPException(status_code=500, detail="Failed to encode the generated page")
        encoded.append(base64.b64encode(buf.tobytes()).decode("ascii"))

    return GenerateResponse(
        examId=request.examId,
        studentId=request.studentId,
        numQuestions=request.numQuestions,
        choicesPerQ=request.choicesPerQ,
        questionsPerPage=cfg.questions_per_page,
        pageCount=len(encoded),
        pages=encoded,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
