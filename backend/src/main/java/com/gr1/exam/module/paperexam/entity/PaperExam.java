package com.gr1.exam.module.paperexam.entity;

import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity: Đề giấy.
 * Mapping: bảng `paper_exams`
 */
@Entity
@Table(name = "paper_exams")
@SQLDelete(sql = "UPDATE paper_exams SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private String title;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    /**
     * Layout OMR của phiếu trả lời (JSON). Lưu kèm đề để lúc sinh phiếu và lúc
     * chấm dùng cùng một layout — nếu không, offset câu toàn cục giữa các trang lệch.
     * Xem `PaperExamOmrLayoutDTO`.
     */
    @Column(name = "omr_layout", columnDefinition = "TEXT")
    private String omrLayout;

    @Column(name = "show_answers", nullable = false)
    @Builder.Default
    private Boolean showAnswers = Boolean.TRUE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaperExamStatus status = PaperExamStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "paperExam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaperExamChapterConfig> chapterConfigs;

    @OneToMany(mappedBy = "paperExam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaperExamQuestion> questions;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum PaperExamStatus {
        DRAFT,
        ACTIVE,
        ARCHIVED
    }
}
