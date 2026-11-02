package com.gr1.exam.external.vision.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/**
 * Kết quả một lần scan đầy đủ sau khi vision đã được map với đáp án của paper exam.
 */
@Data
@Builder
public class VisionScanAttemptDTO {
    private Integer paperExamId;
    private Integer submissionId;
    private Integer candidateId;
    private Integer actualQuestionCount;

    /** Mã thí sinh đọc được từ QR trên phiếu OMR. */
    private String studentId;

    private VisionScanStatus status;
    private Integer totalScore;
    private Integer correctCount;
    private Integer wrongCount;
    private Integer emptyCount;
    private Integer multiMarkedCount;
    private Integer needsReviewCount;
    private List<VisionQuestionResultDTO> questionResults;
    private VisionScanResponseDTO rawVisionResponse;
    private String rawVisionOutput;
    private Instant scannedAt;
}
