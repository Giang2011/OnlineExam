package com.gr1.exam.module.exam.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

/**
 * Entity: Đề thi (gốc hoặc tráo) của kỳ thi.
 * Mapping: bảng `exam_variants`
 */
@Entity
@Table(name = "exam_variants", uniqueConstraints = {
    @UniqueConstraint(name = "uk_exam_variant", columnNames = {"exam_id", "variant_order"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "variant_order", nullable = false)
    private Integer variantOrder;  // 0 = đề gốc, 1..N-1 = đề tráo

    @Column(name = "is_original", nullable = false)
    @Builder.Default
    private Boolean isOriginal = false;

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamVariantQuestion> questions;
}
