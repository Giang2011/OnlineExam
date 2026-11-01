package com.gr1.exam.external.vision.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Response chuẩn hoá từ vision service sau khi đọc phiếu trả lời.
 */
@Data
@Builder
public class VisionScanResponseDTO {
    private VisionScanStatus status;
    private Integer paperExamId;
    private Integer formVariant;
    private Integer actualQuestionCount;
    private List<VisionRecognizedAnswerDTO> recognizedAnswers;
    private String rawOutput;
    private List<String> errors;
}
