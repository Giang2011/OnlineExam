package com.gr1.exam.module.paperexam.entity;

import com.gr1.exam.module.question.entity.Chapter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

/**
 * Entity: Cấu hình số câu theo chương cho đề giấy.
 * Mapping: bảng `paper_exam_chapter_configs`
 */
@Entity
@Table(name = "paper_exam_chapter_configs")
@SQLDelete(sql = "UPDATE paper_exam_chapter_configs SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperExamChapterConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_exam_id", nullable = false)
    private PaperExam paperExam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(name = "question_count", nullable = false)
    private Integer questionCount;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
