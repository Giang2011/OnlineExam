package com.gr1.exam.module.paperexam.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PaperExamQuestionResponseDTO {
    private Integer id;
    private Integer questionId;
    private Integer chapterId;
    private String chapterName;
    private Integer orderIndex;
    private String content;
    private String imageUrl;
    private List<PaperExamAnswerResponseDTO> answers;
}
