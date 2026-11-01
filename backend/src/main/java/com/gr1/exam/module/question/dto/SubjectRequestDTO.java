package com.gr1.exam.module.question.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubjectRequestDTO {
    @NotBlank(message = "Tên môn học không được để trống")
    private String name;
}
