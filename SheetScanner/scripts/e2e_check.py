"""End-to-end check: sinh phiếu OMR -> tô ô -> scan -> đối chiếu điểm.

Chạy backend + Python service đang chạy, rồi:
  1. đăng nhập (admin)
  2. chuẩn bị câu hỏi (có cả câu nhiều đáp án đúng) + tạo đề giấy
  3. tải phiếu OMR PDF (kiểm tra endpoint sinh phiếu)
  4. đọc đáp án đúng thật của đề, sinh ảnh phiếu đã tô (SheetScanner)
  5. POST /paper-exams/{id}/scan với ảnh của từng trang (đảo thứ tự)
  6. đối chiếu điểm / chi tiết từng câu

Dùng:  python scripts/e2e_check.py --base-url http://localhost:8080/api/v1
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import cv2
import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from omr.config import Layout  # noqa: E402
from omr.geometry import bubble_center_on_page  # noqa: E402
from omr.sheet_generator import generate_sheets  # noqa: E402

# Layout chuẩn — phải khớp với app.vision.omrLayout trong backend.
LAYOUT = Layout()
# 16 câu > 14 câu/trang => đề sinh ra 2 trang phiếu (kiểm tra ghép multi-page).
NUM_QUESTIONS = 16
CHOICES_PER_Q = 4
STUDENT_ID = "E2E001"

# Câu có nhiều đáp án đúng (0-based trong DB): câu thứ 3 (orderIndex 3)
MULTI_CORRECT_QUESTION = 3


def build_exam_config(num_questions: int, questions_per_page: int):
    """Config chỉ dùng để sinh ảnh phiếu (không cần answer key)."""
    from omr.config import ExamConfig

    return ExamConfig(
        exam_id="EXAM-TMP",
        num_questions=num_questions,
        choices_per_q=CHOICES_PER_Q,
        answer_key=[],
        questions_per_page=questions_per_page,
        layout=LAYOUT,
    )


def fill_bubbles(page, cfg, page_index, row, choices):
    """Tô các ô của một câu (row là chỉ số câu trong trang, 0-based)."""
    for c in choices:
        x, y = bubble_center_on_page(cfg, page_index, row, c)
        cv2.circle(page, (x, y), cfg.layout.bubble_radius - 2, (0, 0, 0), -1)
    return page


def ensure_subject_and_chapter(client, subject_id, chapter_id):
    """Bảo đảm có môn + chương riêng cho E2E, trả về (subject_id, chapter_id).

    E2E tự tạo câu hỏi có cả câu nhiều đáp án đúng nên cần chương riêng
    (không dùng chương có sẵn để tránh phụ thuộc dữ liệu của người dùng).
    """
    # Tạo chương trong môn đã chọn
    resp = client.get(f"/subjects/{subject_id}/chapters")
    if resp.status_code >= 400:
        print(f"   Không đọc được danh sách chương: {resp.status_code} {resp.text[:200]}")
        return None

    for ch in resp.json():
        if ch["name"] == "E2E OMR":
            return subject_id, ch["id"]

    resp = client.post(
        f"/subjects/{subject_id}/chapters",
        json={"name": "E2E OMR"},
    )
    if resp.status_code >= 400:
        print(f"   Không tạo được chương E2E: {resp.status_code} {resp.text[:300]}")
        return None
    return subject_id, resp.json()["id"]


def ensure_questions(client, subject_id, chapter_id, count):
    """Tạo `count` câu hỏi trong chương E2E.

    Câu cuối cùng có **2 đáp án đúng** để kiểm tra ngữ nghĩa exact-set-match:
    thí sinh tô đúng cả 2 ô đúng của câu nhiều đáp án đúng phải là CORRECT.
    """
    resp = client.get(f"/subjects/{subject_id}/chapters")
    existing = 0
    if resp.status_code < 400:
        for ch in resp.json():
            if ch["id"] == chapter_id:
                existing = ch.get("questionCount", 0)

    for i in range(existing, count):
        multi = (i == count - 1)
        answers = [
            {
                "content": f"Đáp án {chr(65 + j)}",
                "isCorrect": (j in (0, 2)) if multi else (j == 0),
            }
            for j in range(CHOICES_PER_Q)
        ]
        body = {
            "content": f"E2E câu {i + 1}" + (" (nhiều đáp án đúng)" if multi else ""),
            "subjectId": subject_id,
            "chapterId": chapter_id,
            "answers": answers,
        }
        # Tạo câu hỏi dùng multipart: part "data" = JSON string
        resp = client.post(
            "/questions",
            files={"data": ("data.json", json.dumps(body), "application/json")},
        )
        if resp.status_code >= 400:
            print(f"   Không tạo được câu hỏi: {resp.status_code} {resp.text[:300]}")
            return None
    return chapter_id


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://localhost:8080/api/v1")
    ap.add_argument("--subject-id", type=int, default=1)
    ap.add_argument("--chapter-id", type=int, default=1)
    args = ap.parse_args(argv)

    base = args.base_url.rstrip("/")
    client = httpx.Client(base_url=base, timeout=60.0)

    # --- 1. đăng nhập ---
    resp = client.post("/auth/login", json={"username": "admin", "password": "12345678"})
    resp.raise_for_status()
    print("1. Đăng nhập: OK")

    # CSRF: backend dùng cookie XSRF-TOKEN, các request mutating phải gửi header
    # X-XSRF-TOKEN với giá trị cookie đó.
    csrf = client.cookies.get("XSRF-TOKEN")
    if csrf:
        client.headers["X-XSRF-TOKEN"] = csrf
        print(f"   CSRF token: {csrf[:12]}...")

    # --- 2. tạo đề giấy ---
    chapter = ensure_subject_and_chapter(client, args.subject_id, args.chapter_id)
    if chapter is None:
        print("2. Không chuẩn bị được chương cho đề giấy")
        return 1
    subject_id, chapter_id = chapter

    if ensure_questions(client, subject_id, chapter_id, NUM_QUESTIONS) is None:
        print("2. Không chuẩn bị được câu hỏi cho đề giấy")
        return 1

    body = {
        "title": "E2E OMR check",
        "subjectId": subject_id,
        "durationMinutes": 15,
        "totalQuestions": NUM_QUESTIONS,
        "chapterConfigs": [{"chapterId": chapter_id, "questionCount": NUM_QUESTIONS}],
    }
    resp = client.post("/paper-exams", json=body)
    if resp.status_code >= 400:
        print("2. Tạo đề giấy thất bại:", resp.status_code, resp.text[:500])
        return 1
    exam = resp.json()
    exam_id = exam["id"]
    questions_per_page = exam.get("omrQuestionsPerPage") or NUM_QUESTIONS
    choices_per_q = exam.get("omrChoicesPerQ") or CHOICES_PER_Q
    print(f"2. Tạo đề giấy: OK (id={exam_id}, "
          f"questionsPerPage={questions_per_page}, choicesPerQ={choices_per_q}, "
          f"pageCount={exam.get('omrPageCount')})")

    # --- 3. tải phiếu OMR PDF ---
    resp = client.get(f"/paper-exams/{exam_id}/omr-sheet", params={"studentId": STUDENT_ID})
    if resp.status_code >= 400:
        print("3. Tải phiếu OMR thất bại:", resp.status_code, resp.text[:500])
        return 1
    pdf = resp.content
    is_pdf = pdf[:4] == b"%PDF"
    print(f"3. Tải phiếu OMR PDF: OK ({len(pdf)} bytes, PDF={is_pdf})")
    if not is_pdf:
        print("KẾT QUẢ: FAIL - nội dung không phải PDF")
        return 1

    # --- 4. đọc đáp án đúng thật + sinh ảnh phiếu đã tô ---
    resp = client.get(f"/paper-exams/{exam_id}/answers")
    if resp.status_code >= 400:
        print("4. Đọc đáp án đề thất bại:", resp.status_code, resp.text[:500])
        return 1
    answer_view = resp.json()

    correct_by_index = {}
    for question in answer_view.get("questions", []):
        letters = [
            chr(65 + i)
            for i, answer in enumerate(question.get("answers", []))
            if answer.get("isCorrect")
        ]
        correct_by_index[question["orderIndex"]] = letters
    print(f"4. Đáp án đúng của đề: {correct_by_index}")

    # Chọn câu nhiều đáp án đúng để kiểm tra exact-set-match
    multi_index = next(
        (idx for idx, letters in sorted(correct_by_index.items()) if len(letters) >= 2),
        None,
    )
    if multi_index is None:
        print("   (Không có câu nhiều đáp án đúng trong đề — bỏ qua phần kiểm tra đó)")

    # Kế hoạch tô: mỗi câu tô đúng tập đáp án đúng, trừ 1 câu để trống.
    blank_index = max(correct_by_index) if correct_by_index else 1
    marked = {}
    for index, letters in correct_by_index.items():
        if index == blank_index:
            continue
        marked[index] = [ord(letter) - 65 for letter in letters]
    print(f"   Kế hoạch tô: {marked} (câu {blank_index} để trống)")

    cfg = build_exam_config(NUM_QUESTIONS, questions_per_page)
    pages = generate_sheets(cfg, student_id=STUDENT_ID)
    print(f"   Sinh {len(pages)} trang phiếu")

    image_files = []
    for page_index, page in enumerate(pages):
        for question_index, choices in marked.items():
            row = (question_index - 1) % questions_per_page
            if (question_index - 1) // questions_per_page == page_index:
                fill_bubbles(page, cfg, page_index, row, choices)
        ok, buf = cv2.imencode(".png", page)
        assert ok
        image_files.append((f"page{page_index}.png", buf.tobytes(), "image/png"))

    # --- 5. scan nhiều ảnh (đảo thứ tự để kiểm tra việc không phụ thuộc thứ tự) ---
    files = [("images", (name, data, ctype)) for name, data, ctype in reversed(image_files)]
    resp = client.post(
        f"/paper-exams/{exam_id}/scan",
        files=files,
        data={"actualQuestionCount": str(NUM_QUESTIONS)},
    )
    if resp.status_code >= 400:
        print("5. Scan thất bại:", resp.status_code, resp.text[:800])
        return 1
    result = resp.json()

    print(f"5. Scan: status={result['status']} studentId={result.get('studentId')}")
    for q in result["questionResults"]:
        print(f"     Q{q['questionIndex']}: status={q['status']:<13} "
              f"selected={q['selectedOptions']} correct={q['correctOptions']}")
    if result.get("errors"):
        print(f"   errors: {result['errors']}")

    # --- 6. đối chiếu ---
    by_index = {q["questionIndex"]: q for q in result["questionResults"]}
    problems = []

    if result.get("studentId") != STUDENT_ID:
        problems.append(f"studentId sai: {result.get('studentId')!r}")

    for index, letters in sorted(correct_by_index.items()):
        q = by_index.get(index)
        if q is None:
            problems.append(f"thiếu câu {index} trong kết quả")
            continue
        if index == blank_index:
            if q["status"] != "EMPTY":
                problems.append(f"Q{index} (bỏ trống) phải EMPTY, thực tế {q['status']}")
            continue
        if q["status"] != "CORRECT":
            problems.append(
                f"Q{index} (đáp án {''.join(letters)}) phải CORRECT, "
                f"thực tế {q['status']} selected={q['selectedOptions']}"
            )
        if sorted(q["selectedOptions"]) != sorted(letters):
            problems.append(
                f"Q{index} selected={q['selectedOptions']} khác đáp án đúng {letters}"
            )

    if multi_index is not None and multi_index != blank_index:
        q = by_index.get(multi_index, {})
        if len(q.get("selectedOptions", [])) >= 2:
            print(f"   Câu nhiều đáp án đúng Q{multi_index}: "
                  f"selected={q['selectedOptions']} -> CORRECT (exact-set-match OK)")
        else:
            problems.append(f"Q{multi_index} phải chọn >= 2 đáp án")

    if len(by_index) != NUM_QUESTIONS:
        problems.append(f"phải có {NUM_QUESTIONS} câu, có {len(by_index)}")

    if problems:
        print("\nKẾT QUẢ: FAIL")
        for p in problems:
            print("  - " + p)
        return 1

    print("\nKẾT QUẢ: PASS — sinh phiếu -> tô ô -> scan nhiều trang -> đối chiếu điểm OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
