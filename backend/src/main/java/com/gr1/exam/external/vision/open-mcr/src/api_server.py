from __future__ import annotations

import csv
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field as PydanticField

import grid_info as grid_i
from process_input import process_input


app = FastAPI(title="open-mcr vision service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecognizedAnswer(BaseModel):
    questionIndex: int
    selectedOptions: List[str] = PydanticField(default_factory=list)
    isEmpty: bool = False
    confidence: float = 1.0
    markedCount: int = 0


class ScanResponse(BaseModel):
    status: str
    paperExamId: int
    formVariant: int
    actualQuestionCount: int
    recognizedAnswers: List[RecognizedAnswer]
    rawOutput: Optional[str] = None
    errors: List[str] = PydanticField(default_factory=list)


@dataclass
class _AnswerRow:
    question_index: int
    selected: List[str] = field(default_factory=list)


def _parse_results_csv(results_csv: Path) -> tuple[List[_AnswerRow], str]:
    if not results_csv.exists():
        raise FileNotFoundError(f"Expected results file was not created: {results_csv}")

    with results_csv.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        if not rows:
            return [], ""
        raw_output = results_csv.read_text(encoding="utf-8")
        answer_cols = [c for c in reader.fieldnames or [] if c.startswith("Q")]
        parsed: List[_AnswerRow] = []
        for row in rows:
            for col in answer_cols:
                value = (row.get(col) or "").strip()
                if not value:
                    continue
                try:
                    q_idx = int(col[1:])
                except ValueError:
                    continue
                selected = [part.strip() for part in value.split("|") if part.strip()]
                parsed.append(_AnswerRow(question_index=q_idx, selected=selected))
        return parsed, raw_output


@app.post("/scan", response_model=ScanResponse)
async def scan(
    paperExamId: int = Form(...),
    actualQuestionCount: int = Form(...),
    formVariant: int = Form(75),
    scanMode: str = Form("AUTO"),
    debug: bool = Form(False),
    image: UploadFile = File(...),
):
    if formVariant not in (75, 150):
        raise HTTPException(status_code=400, detail="Unsupported formVariant")
    if not image.filename:
        raise HTTPException(status_code=400, detail="Missing image filename")

    errors: List[str] = []
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        input_dir = tmp_path / "input"
        output_dir = tmp_path / "output"
        input_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        image_path = input_dir / image.filename
        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image upload")
        image_path.write_bytes(image_bytes)

        try:
            process_input(
                [image_path],
                output_dir,
                multi_answers_as_f=False,
                empty_answers_as_g=False,
                keys_file=None,
                arrangement_file=None,
                sort_results=False,
                output_mcta=False,
                debug_mode_on=debug,
                form_variant=grid_i.form_75q if formVariant == 75 else grid_i.form_150q,
                progress_tracker=None,
                files_timestamp=None,
            )
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Failed to process image: {exc}") from exc

        results_csv = output_dir / "results.csv"
        recognized_rows, raw_output = _parse_results_csv(results_csv)

    recognized_answers = [
        RecognizedAnswer(
            questionIndex=row.question_index,
            selectedOptions=row.selected,
            isEmpty=len(row.selected) == 0,
            confidence=1.0 if row.selected else 0.0,
            markedCount=len(row.selected),
        )
        for row in recognized_rows[:actualQuestionCount]
    ]

    return ScanResponse(
        status="SUCCESS" if recognized_answers else "FAILED_TO_READ",
        paperExamId=paperExamId,
        formVariant=formVariant,
        actualQuestionCount=actualQuestionCount,
        recognizedAnswers=recognized_answers,
        rawOutput=raw_output,
        errors=errors,
    )
