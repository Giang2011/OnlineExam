"""Streamlit web app for the OMR grader.

Run with:  streamlit run app/streamlit_app.py

Two tabs: generate printable sheets, and grade uploaded sheets (one or many) with
a results table, item analysis, score histogram and a CSV download.
"""
from __future__ import annotations

import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
import streamlit as st

# allow running from the app/ directory
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from omr.analytics import item_analysis, results_dataframe  # noqa: E402
from omr.config import ConfigError, load_exam_config  # noqa: E402
from omr.detector import SheetNotFoundError, locate_and_warp  # noqa: E402
from omr.grader import annotate, grade_warped  # noqa: E402
from omr.identity import read_identity  # noqa: E402
from omr.sheet_generator import generate_sheet  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ROOT / "config" / "exam_example.yaml"


def _load_config(uploaded):
    if uploaded is None:
        return load_exam_config(DEFAULT_CONFIG)
    with tempfile.NamedTemporaryFile("wb", suffix=".yaml", delete=False) as f:
        f.write(uploaded.getvalue())
        return load_exam_config(f.name)


def _to_rgb(bgr):
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)


def _read_upload(file) -> np.ndarray:
    data = np.frombuffer(file.getvalue(), np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


st.set_page_config(page_title="OMR Test Grader", layout="wide")
st.title("📝 Automated OMR Test Grader")

with st.sidebar:
    st.header("Exam configuration")
    cfg_upload = st.file_uploader("Exam config (YAML)", type=["yaml", "yml"])
    try:
        cfg = _load_config(cfg_upload)
        st.success(f"{cfg.exam_id}: {cfg.num_questions} questions, "
                   f"{cfg.choices_per_q} choices")
        st.caption("Answer key: " + ", ".join(cfg.letters(a) for a in cfg.answer_sets))
    except ConfigError as e:
        st.error(f"Config error: {e}")
        st.stop()

tab_grade, tab_generate = st.tabs(["Grade sheets", "Generate sheet"])

with tab_generate:
    st.subheader("Create a printable answer sheet")
    sid = st.text_input("Student ID (encoded in the QR code)", value="S001")
    if st.button("Generate"):
        sheet = generate_sheet(cfg, student_id=sid or None)
        st.image(_to_rgb(sheet), caption=f"Sheet for {sid}", width=420)
        ok, buf = cv2.imencode(".png", sheet)
        st.download_button("Download PNG", buf.tobytes(),
                           file_name=f"sheet_{sid or 'blank'}.png", mime="image/png")

with tab_grade:
    st.subheader("Upload one or more filled sheets")
    uploads = st.file_uploader("Sheet images", type=["png", "jpg", "jpeg"],
                               accept_multiple_files=True)
    if uploads:
        results = []
        cols = st.columns(min(3, len(uploads)))
        for i, file in enumerate(uploads):
            image = _read_upload(file)
            if image is None:
                st.warning(f"Could not read {file.name}")
                continue
            try:
                warp = locate_and_warp(image, cfg)
            except SheetNotFoundError as e:
                st.warning(f"{file.name}: {e}")
                continue

            ident = read_identity(warp.warped)
            if ident.student_id is None:
                ident = read_identity(image)
            student_id = ident.student_id or Path(file.name).stem
            page_index = ident.page_index or 0

            result = grade_warped(warp.warped, cfg, warp_method=warp.method,
                                  page_index=page_index)
            result.student_id = student_id
            results.append(result)

            with cols[i % len(cols)]:
                st.image(_to_rgb(annotate(warp.warped, result, cfg)),
                         caption=f"{student_id} — {result.score:.0f}%"
                                 f"{' ⚠' if result.flagged else ''}")

        if results:
            st.divider()
            st.subheader("Results")
            df = results_dataframe(results, cfg)
            st.dataframe(df, use_container_width=True)
            st.download_button("Download results.csv", df.to_csv(index=False),
                               file_name="results.csv", mime="text/csv")

            st.subheader("Item analysis")
            items = item_analysis(results, cfg)
            st.dataframe(items, use_container_width=True)
            st.bar_chart(df.set_index("student_id")["score"])
