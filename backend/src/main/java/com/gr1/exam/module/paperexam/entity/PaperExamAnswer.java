package com.gr1.exam.module.paperexam.entity;

import com.gr1.exam.module.question.entity.Answer;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

/**
 * Entity: Đáp án thuộc câu hỏi trong đề giấy.
 * Mapping: bảng `paper_exam_answers`
 */
@Entity
@Table(name = "paper_exam_answers")
@SQLDelete(sql = "UPDATE paper_exam_answers SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperExamAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_exam_question_id", nullable = false)
    private PaperExamQuestion paperExamQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private Answer answer;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    // ===== Snapshot đáp án (chống sửa ngân hàng câu hỏi sau khi in đề) =====
    // Ghi 1 lần khi tạo đề giấy. Nếu null → fallback về entity Answer live (dữ liệu cũ).

    @Column(name = "content_snapshot", columnDefinition = "TEXT")
    private String contentSnapshot;

    @Column(name = "image_url_snapshot", length = 500)
    private String imageUrlSnapshot;

    @Column(name = "is_correct_snapshot")
    private Boolean isCorrectSnapshot;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
