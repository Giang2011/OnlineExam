package com.gr1.exam.module.paperexam.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PaperExamResponseDTO {
    private Integer id;
    private String title;
    private Integer subjectId;
    private String subjectName;
    private Integer durationMinutes;
    private Integer totalQuestions;
    private Boolean showAnswers;
    private String status;
    private Integer createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PaperExamChapterConfigResponseDTO> chapterConfigs;
}
