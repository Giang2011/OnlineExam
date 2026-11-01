package com.gr1.exam.module.question.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO: Response chương trong môn học.
 */
@Data
@Builder
public class ChapterResponseDTO {
    private Integer id;
    private Integer subjectId;
    private String name;
    private Long questionCount;  // Số câu hỏi trong chương
}
