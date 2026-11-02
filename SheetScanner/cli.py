"""Command-line interface for the OMR grader.

    # create printable sheets
    python cli.py generate --config config/exam_example.yaml --id S001
    python cli.py generate --config config/exam_example.yaml --count 30 --out data/samples

    # grade one image or a whole folder
    python cli.py grade --input data/samples --config config/exam_example.yaml --out data/output
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2

from omr.analytics import item_analysis, save_reports
from omr.config import ConfigError, load_exam_config
from omr.detector import SheetNotFoundError, locate_and_warp
from omr.grader import annotate, grade_warped
from omr.identity import read_identity
from omr.sheet_generator import save_sheet, save_sheets

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}


def cmd_generate(args) -> int:
    cfg = load_exam_config(args.config)
    out = Path(args.out)
    if args.count:
        for i in range(1, args.count + 1):
            sid = f"S{i:03d}"
            paths = save_sheets(cfg, out, student_id=sid, prefix=f"sheet_{sid}")
            print(f"Generated {len(paths)} page(s) for {sid} in {out}/")
    else:
        sid = args.id
        path = out / f"sheet_{sid or 'blank'}.png" if out.suffix == "" else out
        save_sheet(cfg, path, student_id=sid)
        print(f"Generated {path}")
    return 0


def _iter_images(input_path: Path):
    if input_path.is_dir():
        yield from sorted(p for p in input_path.iterdir() if p.suffix.lower() in IMAGE_EXTS)
    else:
        yield input_path


def cmd_grade(args) -> int:
    cfg = load_exam_config(args.config)
    out = Path(args.out)
    annotated_dir = out / "annotated"
    annotated_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for img_path in _iter_images(Path(args.input)):
        image = cv2.imread(str(img_path))
        if image is None:
            print(f"  ! skipped (unreadable): {img_path.name}")
            continue
        try:
            warp = locate_and_warp(image, cfg)
        except SheetNotFoundError as e:
            print(f"  ! skipped ({e}): {img_path.name}")
            continue

        # decode the QR from the warped page (clean, upright) and fall back to the raw image
        ident = read_identity(warp.warped)
        if ident.student_id is None:
            ident = read_identity(image)
        student_id = ident.student_id or img_path.stem
        page_index = ident.page_index or 0
        result = grade_warped(warp.warped, cfg, warp_method=warp.method, page_index=page_index)
        result.student_id = student_id

        cv2.imwrite(str(annotated_dir / f"{student_id}_graded.png"),
                    annotate(warp.warped, result, cfg))
        results.append(result)
        print(f"  {student_id}: {result.score:.1f}%  ({result.warp_method}, "
              f"{len(result.flagged)} flagged)")

    if not results:
        print("No sheets graded.")
        return 1

    paths = save_reports(results, cfg, out)
    print(f"\nGraded {len(results)} sheet(s).")
    print(f"  results      -> {paths['results']}")
    print(f"  item analysis-> {paths['item_analysis']}")
    print(f"  histogram    -> {paths['histogram']}")
    print(f"  annotated    -> {annotated_dir}/")
    print("\nItem analysis:")
    print(item_analysis(results, cfg).to_string(index=False))
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Automated OMR test grader")
    sub = parser.add_subparsers(dest="command", required=True)

    g = sub.add_parser("generate", help="generate printable answer sheet(s)")
    g.add_argument("--config", required=True)
    g.add_argument("--id", help="student id to encode in the QR code")
    g.add_argument("--count", type=int, help="generate N numbered blank sheets instead")
    g.add_argument("--out", default="data/samples")
    g.set_defaults(func=cmd_generate)

    gr = sub.add_parser("grade", help="grade an image or a folder of images")
    gr.add_argument("--input", required=True, help="image file or directory")
    gr.add_argument("--config", required=True)
    gr.add_argument("--out", default="data/output")
    gr.set_defaults(func=cmd_grade)

    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except ConfigError as e:
        print(f"Config error: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
