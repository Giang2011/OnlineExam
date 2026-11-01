package com.gr1.exam.external.vision.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * DTO nhận kết quả nhận dạng từ Python Vision Service.
 */
@Data
public class VisionResponseDTO {
    private String examCode;          // Mã đề nhận diện được
    private List<DetectedAnswer> answers;

    @Data
    public static class DetectedAnswer {
        private Integer questionIndex;  // Thứ tự câu hỏi trên phiếu
        private String selectedOption;  // A, B, C, D hoặc null (bỏ trống)
        private Double confidence;      // Độ tin cậy nhận diện (0.0 - 1.0)
    }
}
