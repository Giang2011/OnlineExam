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

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('DOING','SUBMITTED') DEFAULT 'DOING'")
    private Status status;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    public enum Status {
        DOING, SUBMITTED
    }

    @PrePersist
    protected void onCreate() {
        this.startTime = LocalDateTime.now();
        this.status = Status.DOING;
    }
}
