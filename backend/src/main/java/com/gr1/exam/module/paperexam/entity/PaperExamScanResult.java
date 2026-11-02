package com.gr1.exam.module.paperexam.entity;

import com.gr1.exam.external.vision.dto.VisionScanStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity: Kết quả scan của đề giấy.
 * Mapping: bảng `paper_exam_scan_results`
 */
@Entity
@Table(name = "paper_exam_scan_results")
@SQLDelete(sql = "UPDATE paper_exam_scan_results SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperExamScanResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_exam_id", nullable = false)
    private PaperExam paperExam;

    @Column(name = "paper_exam_id", insertable = false, updatable = false)
    private Integer paperExamId;

    @Column(name = "actual_question_count", nullable = false)
    private Integer actualQuestionCount;

    /**
     * Mã thí sinh đọc được từ QR trên phiếu (có thể null nếu QR không đọc được).
     */
    @Column(name = "student_id", length = 100)
    private String studentId;

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "score", nullable = false)
    private Float score;

    @Column(name = "total_correct", nullable = false)
    private Integer totalCorrect;

    @Column(name = "total_wrong", nullable = false)
    private Integer totalWrong;

    @Column(name = "total_empty", nullable = false)
    private Integer totalEmpty;

    @Column(name = "total_needs_review", nullable = false)
    private Integer totalNeedsReview;

    @Column(name = "total_multi_marked", nullable = false)
    private Integer totalMultiMarked;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VisionScanStatus status;

    @Column(name = "image_path", nullable = false)
    private String imagePath;

    @Column(name = "raw_vision_output", columnDefinition = "TEXT")
    private String rawVisionOutput;

    @Column(name = "vision_errors", columnDefinition = "TEXT")
    private String visionErrors;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "scanResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaperExamScanQuestionResult> questionResults;

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
}
