package com.gr1.exam.module.exam.entity;

import com.gr1.exam.module.question.entity.Answer;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity: Đáp án đã xáo trộn trong câu hỏi variant.
 * Mapping: bảng `exam_variant_answers`
 */
@Entity
@Table(name = "exam_variant_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamVariantAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_question_id", nullable = false)
    private ExamVariantQuestion variantQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private Answer answer;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    // ===== Snapshot đề thi (chống sửa ngân hàng câu hỏi khi đang thi) =====
    // Ghi 1 lần khi sinh variant. Nếu null → fallback về entity Answer live (dữ liệu cũ).

    @Column(name = "content_snapshot", columnDefinition = "TEXT")
    private String contentSnapshot;

    @Column(name = "image_url_snapshot", length = 500)
    private String imageUrlSnapshot;

    @Column(name = "is_correct_snapshot")
    private Boolean isCorrectSnapshot;
}
