package com.gr1.exam.module.exam.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExamParticipantDTO {

    @NotNull(message = "User ID không được để trống")
    private Integer userId;
}
