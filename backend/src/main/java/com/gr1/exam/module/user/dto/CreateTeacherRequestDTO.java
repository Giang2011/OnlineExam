package com.gr1.exam.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO: Tạo tài khoản Teacher (Admin nhập thủ công username + password + name).
 */
@Data
public class CreateTeacherRequestDTO {
    @NotBlank(message = "Username không được để trống")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;

    @NotBlank(message = "Tên không được để trống")
    private String name;
}
