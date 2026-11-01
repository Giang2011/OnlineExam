package com.gr1.exam.module.session.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Phiên thi đang diễn ra của user — dùng để FE khôi phục sau khi đóng trình duyệt.
 * Trả về {@code null} (HTTP 204) nếu user không có phiên nào đang chạy.
 */
@Data
@Builder
public class ActiveSessionResponseDTO {
    private Integer sessionId;
    private Integer examId;
    private String examTitle;
    private Integer attemptNo;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime deadlineAt;
    private LocalDateTime serverTime;
    private Long remainingSeconds;
}
