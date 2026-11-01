package com.gr1.exam.module.exam.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * DTO: Cấu hình số câu lấy từ 1 chương cho kỳ thi.
 */
@Data
public class ChapterConfigDTO {
    @NotNull
    private Integer chapterId;

    @NotNull @Positive
    private Integer questionCount;
}
