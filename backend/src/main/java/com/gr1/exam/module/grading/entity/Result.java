package com.gr1.exam.module.grading.entity;

import com.gr1.exam.module.session.entity.ExamSession;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * Entity: Kết quả chấm điểm.
 * Mapping: bảng `results`
 */
@Entity
@Table(name = "results")
@SQLDelete(sql = "UPDATE results SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_session_id", nullable = false, unique = true)
    private ExamSession examSession;

    @Column(columnDefinition = "FLOAT DEFAULT 0.0")
    private Float score;

    @Column(name = "total_correct", columnDefinition = "INT DEFAULT 0")
    private Integer totalCorrect;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }
}
