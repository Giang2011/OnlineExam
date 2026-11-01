package com.gr1.exam.module.paperexam.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PaperExamPreviewResponseDTO {
    private Integer paperExamId;
    private String title;
    private Integer durationMinutes;
    private Integer totalQuestions;
    private Boolean showAnswers;
    private List<PaperExamQuestionResponseDTO> questions;
}
