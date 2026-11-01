package com.gr1.exam.module.session.entity;

import com.gr1.exam.module.exam.entity.ExamVariantQuestion;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity: Đáp án mà thí sinh đã chọn.
 * Mapping: bảng `user_answers`
 */
@Entity
@Table(name = "user_answers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_session_id", nullable = false)
    private ExamSession examSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_question_id", nullable = false)
    private ExamVariantQuestion variantQuestion;

    @OneToMany(mappedBy = "userAnswer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserAnswerSelection> selectedAnswers = new ArrayList<>();
}
