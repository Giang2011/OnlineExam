package com.gr1.exam.core.exception;

/**
 * Ném ra khi user ĐÃ xác thực nhưng không có quyền truy cập tài nguyên.
 *
 * <p>Phân biệt với {@link UnauthorizedException} (401 — chưa đăng nhập / phiên hết hạn):
 * frontend dựa vào 401 để redirect về trang login, còn 403 thì chỉ cần báo lỗi.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
