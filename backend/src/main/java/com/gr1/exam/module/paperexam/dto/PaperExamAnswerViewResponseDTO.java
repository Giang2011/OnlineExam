package com.gr1.exam.module.paperexam.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PaperExamAnswerViewResponseDTO {
    private Integer paperExamId;
    private String title;
    private Boolean showAnswers;
    private List<PaperExamQuestionResponseDTO> questions;
}
