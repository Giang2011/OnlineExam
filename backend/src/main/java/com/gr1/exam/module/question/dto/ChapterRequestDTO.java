package com.gr1.exam.module.question.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO: Tạo/sửa chương trong môn học.
 */
@Data
public class ChapterRequestDTO {
    @NotBlank(message = "Tên chương không được để trống")
    private String name;
}
