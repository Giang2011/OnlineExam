package com.gr1.exam.module.exam.entity;

import com.gr1.exam.module.question.entity.Chapter;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity: Cấu hình số câu lấy từ mỗi chương cho kỳ thi.
 * Mapping: bảng `exam_chapter_configs`
 */
@Entity
@Table(name = "exam_chapter_configs", uniqueConstraints = {
    @UniqueConstraint(name = "uk_exam_chapter", columnNames = {"exam_id", "chapter_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamChapterConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;  // Số câu lấy từ chương này
}
