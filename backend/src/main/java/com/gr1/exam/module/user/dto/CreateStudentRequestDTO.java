package com.gr1.exam.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO: Tạo tài khoản Student.
 * Server sẽ tự động random username + password.
 */
@Data
public class CreateStudentRequestDTO {
    @NotBlank(message = "MSSV không được để trống")
    private String studentId;

    @NotBlank(message = "Tên không được để trống")
    private String name;
}
