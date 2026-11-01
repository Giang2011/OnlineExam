package com.gr1.exam.module.paperexam.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaperExamChapterConfigResponseDTO {
    private Integer id;
    private Integer chapterId;
    private String chapterName;
    private Integer questionCount;
}
