package com.gr1.exam.module.paperexam.dto;

import com.gr1.exam.external.vision.dto.VisionScanStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PaperExamScanResponseDTO {
    private Integer id;
    private VisionScanStatus status;
    private Integer paperExamId;
    private Integer actualQuestionCount;

    /** Mã thí sinh đọc được từ QR trên phiếu. */
    private String studentId;

    private Integer totalQuestions;
    private Float score;
    private Integer totalCorrect;
    private Integer totalWrong;
    private Integer totalEmpty;
    private Integer totalNeedsReview;
    private Integer totalMultiMarked;
    private String imagePath;

    /**
     * Đường dẫn ảnh phiếu đã khoanh (vòng xanh = ô đã tô đúng, vòng đỏ = ô đã tô sai).
     * Nhiều trang thì nối bằng dấu phẩy. Có thể null nếu engine không trả ảnh.
     */
    private String annotatedImagePath;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PaperExamScanQuestionResultDTO> questionResults;
    private String rawVisionOutput;
    private List<String> errors;
}
