package com.gr1.exam.module.session.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class SubmitSessionRequestDTO {

    @NotNull(message = "Danh sách đáp án không được để trống")
    @Valid
    private List<QuestionAnswerSubmissionDTO> answers = new ArrayList<>();
}
