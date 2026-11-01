package com.gr1.exam.module.session.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Response của phiên thi — luôn kèm mốc thời gian server để FE không tự đếm ngược
 * (tránh lệch đồng hồ của máy thí sinh).
 */
@Data
@Builder
public class ExamSessionResponseDTO {
    private Integer id;
    private Integer examId;
    private String examTitle;
    private Integer userId;
    private String userName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;

    /** Lượt thi thứ mấy (1..exams.maxAttempts). */
    private Integer attemptNo;

    /** Hạn chót server-side. */
    private LocalDateTime deadlineAt;

    /** Thời điểm hiện tại của server. */
    private LocalDateTime serverTime;

    /** Số giây còn lại (có thể âm nếu đã quá hạn). */
    private Long remainingSeconds;

    /** Nguồn nộp bài hiện tại: MANUAL / TIMEOUT / GRACE / RESUME. */
    private String submitSource;
}
