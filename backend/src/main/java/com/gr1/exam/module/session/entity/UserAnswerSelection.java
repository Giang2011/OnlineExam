package com.gr1.exam.module.session.entity;

import com.gr1.exam.module.question.entity.Answer;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_answer_selections", uniqueConstraints = {
    @UniqueConstraint(name = "uk_user_answer_selection", columnNames = { "user_answer_id", "selected_answer_id" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnswerSelection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_answer_id", nullable = false)
    private UserAnswer userAnswer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_answer_id", nullable = false)
    private Answer selectedAnswer;
}
