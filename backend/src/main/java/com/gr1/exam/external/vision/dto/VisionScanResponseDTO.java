package com.gr1.exam.external.vision.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Response chuẩn hoá từ vision service sau khi đọc phiếu trả lời.
 */
@Data
@Builder
public class VisionScanResponseDTO {
    private VisionScanStatus status;
    private Integer paperExamId;
    private Integer actualQuestionCount;

    /** Mã thí sinh đọc được từ QR trên phiếu (có thể null). */
    private String studentId;

    /** Mã đề đọc được từ QR trên phiếu (có thể null). */
    private String examId;

    /** Chỉ số trang (0-based) của phiếu vừa đọc. */
    private Integer pageIndex;

    /** Cách căn chỉnh trang: "aruco" hoặc "contour". */
    private String warpMethod;

    private List<VisionRecognizedAnswerDTO> recognizedAnswers;

    /**
     * Ảnh trang phiếu đã khoanh, PNG base64.
     *
     * <p>Có giá trị khi request gửi kèm {@code answerKey}; vòng xanh là ô thí sinh
     * đã tô đúng, vòng đỏ là ô thí sinh đã tô sai. Ô đáp án đúng mà thí sinh bỏ
     * trống không được khoanh, nên ảnh không tiết lộ đáp án.
     */
    private String annotatedImage;

    private String rawOutput;
    private List<String> errors;
}
