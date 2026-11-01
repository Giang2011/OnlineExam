package com.gr1.exam.module.session.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class QuestionAnswerSubmissionDTO {

    @NotNull(message = "ID câu hỏi variant không được để trống")
    private Integer variantQuestionId;

    private List<Integer> selectedAnswerIds = new ArrayList<>();
}
