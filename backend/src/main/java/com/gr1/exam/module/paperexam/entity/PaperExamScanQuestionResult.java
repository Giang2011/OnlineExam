package com.gr1.exam.module.paperexam.entity;

import com.gr1.exam.external.vision.dto.VisionQuestionScanStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

import java.util.List;

/**
 * Entity: Chi tiết từng câu trong kết quả scan.
 * Mapping: bảng `paper_exam_scan_question_results`
 */
@Entity
@Table(name = "paper_exam_scan_question_results")
@SQLDelete(sql = "UPDATE paper_exam_scan_question_results SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperExamScanQuestionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scan_result_id", nullable = false)
    private PaperExamScanResult scanResult;

    @Column(name = "question_index", nullable = false)
    private Integer questionIndex;

    @ElementCollection
    @CollectionTable(name = "paper_exam_scan_question_result_selected_options", joinColumns = @JoinColumn(name = "question_result_id"))
    @Column(name = "selected_option", nullable = false)
    private List<String> selectedOptions;

    @ElementCollection
    @CollectionTable(name = "paper_exam_scan_question_result_correct_options", joinColumns = @JoinColumn(name = "question_result_id"))
    @Column(name = "correct_option", nullable = false)
    private List<String> correctOptions;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VisionQuestionScanStatus status;

    @Column(name = "is_empty", nullable = false)
    private Boolean isEmpty;

    @Column(name = "marked_count")
    private Integer markedCount;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;
}
