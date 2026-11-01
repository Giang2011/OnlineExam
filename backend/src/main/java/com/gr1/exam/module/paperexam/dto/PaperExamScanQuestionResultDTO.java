package com.gr1.exam.module.paperexam.dto;

import com.gr1.exam.external.vision.dto.VisionQuestionScanStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PaperExamScanQuestionResultDTO {
    private Integer questionIndex;
    private List<String> selectedOptions;
    private List<String> correctOptions;
    private VisionQuestionScanStatus status;
    private Boolean isEmpty;
    private Integer markedCount;
    private Double confidence;
    private String note;
}
