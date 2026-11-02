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

    /**
     * Số câu trên mỗi trang phiếu OMR của đề này.
     * Client cần biết để biết mỗi trang chứa bao nhiêu câu khi ghép nhiều ảnh.
     */
    private Integer omrQuestionsPerPage;

    /** Số lựa chọn tối đa mỗi câu của đề (A..E). */
    private Integer omrChoicesPerQ;

    /** Số trang phiếu OMR cần thiết cho đề này. */
    private Integer omrPageCount;

    private Boolean showAnswers;
    private String status;
    private Integer createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PaperExamChapterConfigResponseDTO> chapterConfigs;
}
