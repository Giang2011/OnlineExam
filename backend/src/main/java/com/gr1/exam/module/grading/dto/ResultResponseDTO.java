package com.gr1.exam.module.grading.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ResultResponseDTO {
    private Integer id;
    private Integer rank;
    private Integer examSessionId;
    private String examTitle;
    private String studentName;
    private Float score;
    private Integer totalCorrect;
    private Integer totalQuestions;
    private LocalDateTime submittedAt;
}
