package com.gr1.exam.module.user.dto;

import lombok.Data;

/**
 * DTO: Teacher tự cập nhật thông tin (PUT /users/me).
 */
@Data
public class UpdateProfileRequestDTO {
    private String username;   // Có thể đổi
    private String password;   // Có thể đổi
    private String name;       // Có thể đổi
}
