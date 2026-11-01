package com.gr1.exam.external.vision.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Chi tiết kết quả chấm cho một câu hỏi trong bài scan.
 */
@Data
@Builder
public class VisionQuestionResultDTO {
    private Integer questionIndex;
    private List<String> selectedOptions;
    private List<String> correctOptions;
    private VisionQuestionScanStatus status;
    private Boolean isEmpty;
    private Integer markedCount;
    private Double confidence;
    private String note;
}
