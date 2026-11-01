package com.gr1.exam.module.exam.entity;

import com.gr1.exam.module.question.entity.Subject;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity: Kỳ thi.
 * Mapping: bảng `exams`
 */
@Entity
@Table(name = "exams")
@SQLDelete(sql = "UPDATE exams SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private Integer duration; // phút

    @Column(name = "total_questions", nullable = false)
    private Integer totalQuestions;

    @Column(name = "total_variants", nullable = false)
    @Builder.Default
    private Integer totalVariants = 1;  // 1 gốc + (N-1) tráo

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamChapterConfig> chapterConfigs;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamVariant> variants;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
