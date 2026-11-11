package com.gr1.exam.module.user.dto;

import lombok.Data;

/**
 * DTO: Admin sửa tài khoản (PUT /users/{id}).
 *
 * <p>Tất cả field đều optional → hỗ trợ partial update (chỉ gửi field cần đổi).
 * Field bỏ trống / null sẽ được giữ nguyên giá trị cũ.
 */
@Data
public class UpdateUserRequestDTO {
    /** Có thể đổi. */
    private String username;

    /** Có thể đổi (sẽ được hash lại). */
    private String password;

    /** Có thể đổi. */
    private String name;
}
