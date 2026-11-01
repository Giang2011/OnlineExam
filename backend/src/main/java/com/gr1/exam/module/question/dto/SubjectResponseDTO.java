package com.gr1.exam.module.question.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SubjectResponseDTO {
    private Integer id;
    private String name;
    private List<ChapterResponseDTO> chapters;
}
