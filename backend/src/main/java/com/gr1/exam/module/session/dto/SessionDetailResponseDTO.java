package com.gr1.exam.module.session.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Chi tiết 1 phiên thi (deadline, lượt thi, trạng thái, thời gian còn lại).
 */
@Data
@Builder
public class SessionDetailResponseDTO {
    private Integer sessionId;
    private Integer examId;
    private String examTitle;
    private Integer attemptNo;
    private Integer maxAttempts;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime deadlineAt;
    private LocalDateTime serverTime;
    private Long remainingSeconds;
    private String submitSource;
    /** True nếu thí sinh đã dùng hết lượt thi. */
    private Boolean attemptsExhausted;
}
