package com.gr1.exam.module.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

/**
 * Response đăng nhập.
 *
 * <p>Không còn trả JWT. Xác thực bằng cookie phiên {@code EXAMSESSION} (HttpOnly).
 * FE dùng {@code GET /auth/me} để lấy lại thông tin user sau khi reload trang.
 */
@Data
@Builder
@AllArgsConstructor
public class LoginResponseDTO {
    private UserResponseDTO user;
    /** Role của user: ADMIN / TEACHER / STUDENT. */
    private String role;
}
