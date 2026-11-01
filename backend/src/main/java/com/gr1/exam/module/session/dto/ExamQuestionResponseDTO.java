package com.gr1.exam.module.session.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * DTO trả về câu hỏi đã xáo trộn cho thí sinh (từ variant đã gán).
 * KHÔNG chứa thông tin đáp án đúng.
 */
@Data
@Builder
public class ExamQuestionResponseDTO {
    private Integer variantQuestionId;
    private Integer orderIndex;
    private String content;
    private String imageUrl;
    private Boolean isMultipleChoice;
    private List<ShuffledAnswerDTO> answers;

    @Data
    @Builder
    public static class ShuffledAnswerDTO {
        private Integer answerId;
        private Integer orderIndex;
        private String content;
        private String imageUrl;
        // KHÔNG có trường isCorrect → bảo mật đáp án
    }
}
