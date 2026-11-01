package com.gr1.exam.module.exam.entity;

import com.gr1.exam.module.question.entity.Question;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

/**
 * Entity: Câu hỏi đã xáo trộn trong đề thi variant.
 * Mapping: bảng `exam_variant_questions`
 */
@Entity
@Table(name = "exam_variant_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamVariantQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ExamVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    // ===== Snapshot đề thi (chống sửa ngân hàng câu hỏi khi đang thi) =====
    // Ghi 1 lần khi sinh variant. Nếu null → fallback về entity Question live (dữ liệu cũ).

    @Column(name = "content_snapshot", columnDefinition = "TEXT")
    private String contentSnapshot;

    @Column(name = "image_url_snapshot", length = 500)
    private String imageUrlSnapshot;

    @Column(name = "multi_choice_snapshot")
    private Boolean multiChoiceSnapshot;

    @OneToMany(mappedBy = "variantQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamVariantAnswer> answers;
}
