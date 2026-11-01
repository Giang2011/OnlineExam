package com.gr1.exam.module.session.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Đáp án draft đã autosave của một phiên thi — FE dùng để khôi phục bài làm
 * sau khi đóng trình duyệt.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionAnswersResponseDTO {
    private Integer sessionId;
    private Integer attemptNo;
    private List<SavedAnswerDTO> answers = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SavedAnswerDTO {
        /** ID câu hỏi trong variant (exam_variant_questions.id). */
        private Integer variantQuestionId;
        /** Danh sách ID đáp án đã chọn. */
        private List<Integer> selectedAnswerIds = new ArrayList<>();
    }
}
