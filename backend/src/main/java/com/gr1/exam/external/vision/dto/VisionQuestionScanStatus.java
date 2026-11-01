package com.gr1.exam.external.vision.dto;

/**
 * Trạng thái chấm cho từng câu sau khi map kết quả vision với đáp án.
 */
public enum VisionQuestionScanStatus {
    CORRECT,
    WRONG,
    EMPTY,
    MULTI_MARKED,
    NEEDS_REVIEW,
    IGNORED
}
