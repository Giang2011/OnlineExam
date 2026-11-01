package com.gr1.exam.module.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * DTO nhận dữ liệu text (JSON) khi tạo/cập nhật câu hỏi.
 * Được gửi dưới dạng JSON string trong part "data" của multipart/form-data request.
 * Ảnh minh họa được gửi riêng qua các part file (questionImage, answerImages[]).
 */
@Data
public class QuestionRequestDTO {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String content;

    @NotNull(message = "Môn học không được để trống")
    private Integer subjectId;

    @NotNull(message = "Chương không được để trống")
    private Integer chapterId;  // Bắt buộc

    private Boolean questionImageRemoved;

    private List<AnswerDTO> answers;

    @Data
    public static class AnswerDTO {
        @NotBlank
        private String content;
        private Boolean isCorrect;
        private Boolean imageRemoved;
    }
}
