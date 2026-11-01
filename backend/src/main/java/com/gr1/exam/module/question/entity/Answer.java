package com.gr1.exam.module.question.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

/**
 * Entity: Đáp án của câu hỏi.
 * Mapping: bảng `answers`
 */
@Entity
@Table(name = "answers")
@SQLDelete(sql = "UPDATE answers SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_url")
    private String imageUrl;  // Đường dẫn ảnh minh họa

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
