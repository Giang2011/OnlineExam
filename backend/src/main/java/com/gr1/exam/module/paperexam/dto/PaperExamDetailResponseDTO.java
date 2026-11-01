package com.gr1.exam.module.paperexam.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PaperExamDetailResponseDTO {
    private PaperExamResponseDTO paperExam;
    private List<PaperExamQuestionResponseDTO> questions;
}
