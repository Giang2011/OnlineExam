package com.gr1.exam.external.vision.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Response từ endpoint `/sheets/generate` của Python vision service:
 * danh sách trang phiếu OMR (mỗi trang là 1 PNG base64).
 */
@Data
@Builder
public class VisionSheetGenerateResponseDTO {
    private String examId;
    private String studentId;
    private Integer numQuestions;
    private Integer choicesPerQ;
    private Integer questionsPerPage;
    private Integer pageCount;

    /** Mỗi phần tử là PNG base64 của một trang phiếu. */
    private List<String> pages;
}
