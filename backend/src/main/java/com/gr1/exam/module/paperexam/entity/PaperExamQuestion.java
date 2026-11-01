package com.gr1.exam.module.paperexam.entity;

import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.util.List;

/**
 * Entity: Câu hỏi thuộc đề giấy.
 * Mapping: bảng `paper_exam_questions`
 */
@Entity
@Table(name = "paper_exam_questions")
@SQLDelete(sql = "UPDATE paper_exam_questions SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperExamQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_exam_id", nullable = false)
    private PaperExam paperExam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @OneToMany(mappedBy = "paperExamQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaperExamAnswer> answers;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
