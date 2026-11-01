package com.gr1.exam.module.session.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Autosave đáp án — body cho {@code PUT /sessions/{id}/answers}.
 * Không chấm điểm, không đổi trạng thái phiên.
 */
@Data
public class SaveAnswersRequestDTO {

    @NotNull(message = "Danh sách đáp án không được để trống")
    @Valid
    private List<QuestionAnswerSubmissionDTO> answers = new ArrayList<>();
}
