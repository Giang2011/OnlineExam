package com.gr1.exam.external.vision.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Kết quả nhận diện cho một câu trên phiếu trả lời.
 */
@Data
@Builder
public class VisionRecognizedAnswerDTO {
    private Integer questionIndex;
    private List<String> selectedOptions;
    private Boolean isEmpty;
    private Double confidence;
    private Integer markedCount;
}
