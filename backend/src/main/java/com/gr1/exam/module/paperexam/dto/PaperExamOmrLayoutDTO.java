package com.gr1.exam.module.paperexam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Layout OMR của một đề giấy.
 *
 * Lưu kèm theo đề (PaperExam.omrLayout) để đảm bảo lúc sinh phiếu và lúc chấm dùng
 * *cùng* một layout — nếu không, offset câu toàn cục giữa các trang sẽ lệch.
 *
 * Các field tương ứng với `SheetScanner/omr/config.py::Layout`.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaperExamOmrLayoutDTO {
    private Integer bubbleRadius;
    private Integer choiceSpacing;
    private Integer rowSpacing;
    private Integer marginTop;
    private Integer marginLeft;
    private Integer pageWidth;
    private Integer pageHeight;
    private Integer markerSize;
    private Integer markerMargin;

    /** Số câu trên mỗi trang phiếu. */
    private Integer questionsPerPage;

    /** Số lựa chọn tối đa trên mỗi câu (A..E là 5). */
    private Integer choicesPerQ;

    /**
     * Trả về layout ở dạng JSON đúng format mà Python service mong đợi
     * (tên field snake_case như trong `SheetScanner/omr/config.py`).
     */
    public String toLayoutJson() {
        StringBuilder sb = new StringBuilder("{");
        appendIfPresent(sb, "bubble_radius", bubbleRadius);
        appendIfPresent(sb, "choice_spacing", choiceSpacing);
        appendIfPresent(sb, "row_spacing", rowSpacing);
        appendIfPresent(sb, "margin_top", marginTop);
        appendIfPresent(sb, "margin_left", marginLeft);
        appendIfPresent(sb, "page_width", pageWidth);
        appendIfPresent(sb, "page_height", pageHeight);
        appendIfPresent(sb, "marker_size", markerSize);
        appendIfPresent(sb, "marker_margin", markerMargin);
        sb.append("}");
        return sb.toString();
    }

    private static void appendIfPresent(StringBuilder sb, String name, Integer value) {
        if (value == null) {
            return;
        }
        if (sb.length() > 1) {
            sb.append(",");
        }
        sb.append("\"").append(name).append("\":").append(value);
    }
}
