package com.gr1.exam.module.question.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuestionResponseDTO {
    private Integer id;
    private String content;
    private String imageUrl;
    private Integer subjectId;
    private String subjectName;
    private Integer chapterId;
    private String chapterName;
    private LocalDateTime createdAt;
    private List<AnswerResponseDTO> answers;

    @Data
    @Builder
    public static class AnswerResponseDTO {
        private Integer id;
        private String content;
        private String imageUrl;
        private Boolean isCorrect;
    }
}
