package com.gr1.exam.module.session.entity;

import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.exam.entity.ExamVariant;
import com.gr1.exam.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * Entity: Phiên thi của thí sinh.
 * Mapping: bảng `exam_sessions`
 */
@Entity
@Table(name = "exam_sessions")
@SQLDelete(sql = "UPDATE exam_sessions SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ExamVariant variant;  // Đề tráo được gán

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    /**
     * Hạn chót server-side = min(startTime + duration, exam.endTime).
     * Server là nguồn sự thật, không phụ thuộc đồng hồ của trình duyệt.
     */
    @Column(name = "deadline_at")
    private LocalDateTime deadlineAt;

    /**
     * Lượt thi thứ mấy (1..exams.maxAttempts).
     */
    @Column(name = "attempt_no", nullable = false)
    @Builder.Default
    private Integer attemptNo = 1;

    /**
     * Nguồn nộp bài: thí sinh bấm nộp, hết giờ do server tự nộp, hoặc nộp trong cửa sổ gia hạn.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "submit_source", columnDefinition = "ENUM('MANUAL','TIMEOUT','GRACE','RESUME') DEFAULT 'MANUAL'")
    @Builder.Default
    private SubmitSource submitSource = SubmitSource.MANUAL;

    /**
     * Mốc autosave đáp án gần nhất — dùng để khôi phục bài làm sau khi đóng trình duyệt.
     */
    @Column(name = "last_saved_at")
    private LocalDateTime lastSavedAt;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('DOING','SUBMITTED') DEFAULT 'DOING'")
    private Status status;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    public enum Status {
        DOING, SUBMITTED
    }

    public enum SubmitSource {
        /** Thí sinh chủ động bấm nộp bài. */
        MANUAL,
        /** Server tự nộp khi hết thời gian (deadline + grace đã trôi qua). */
        TIMEOUT,
        /** Thí sinh bấm nộp hơi muộn, vẫn nằm trong cửa sổ gia hạn. */
        GRACE,
        /** Phiên được khôi phục sau khi đóng trình duyệt. */
        RESUME
    }

    @PrePersist
    protected void onCreate() {
        this.startTime = LocalDateTime.now();
        this.status = Status.DOING;
    }
}
