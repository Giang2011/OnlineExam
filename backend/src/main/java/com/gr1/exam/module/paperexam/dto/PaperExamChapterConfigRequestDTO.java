package com.gr1.exam.module.paperexam.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class PaperExamChapterConfigRequestDTO {

    @NotNull(message = "ID chương không được để trống")
    private Integer chapterId;

    @NotNull(message = "Số câu hỏi theo chương không được để trống")
    @Positive(message = "Số câu hỏi theo chương phải lớn hơn 0")
    private Integer questionCount;
}
