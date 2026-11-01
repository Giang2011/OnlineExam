package com.gr1.exam.module.paperexam.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaperExamAnswerResponseDTO {
    private Integer id;
    private Integer answerId;
    private Integer orderIndex;
    private String content;
    private String imageUrl;
    private Boolean isCorrect;
}
