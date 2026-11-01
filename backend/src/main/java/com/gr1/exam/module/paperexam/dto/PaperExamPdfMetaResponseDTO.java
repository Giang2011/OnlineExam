package com.gr1.exam.module.paperexam.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaperExamPdfMetaResponseDTO {
    private Integer paperExamId;
    private String title;
    private Integer totalPages;
    private String fileName;
    private String contentType;
}
