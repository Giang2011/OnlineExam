package com.gr1.exam.module.paperexam.dto;

import lombok.Data;

@Data
public class PaperExamScanRequestDTO {
    private Integer actualQuestionCount;
    private Integer formVariant = 75;
    private Boolean debug = Boolean.FALSE;
    private String scanMode = "AUTO";
}
