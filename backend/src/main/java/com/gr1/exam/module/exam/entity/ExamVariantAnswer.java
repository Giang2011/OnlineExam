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
}
