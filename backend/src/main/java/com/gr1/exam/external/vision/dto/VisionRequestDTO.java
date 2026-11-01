package com.gr1.exam.external.vision.dto;

import lombok.Data;

/**
 * DTO gửi ảnh phiếu trả lời đến Python Vision Service.
 */
@Data
public class VisionRequestDTO {
    private String imageBase64;  // Ảnh dạng Base64
    private String imageUrl;     // Hoặc URL ảnh
    private Integer examId;      // Kỳ thi tương ứng
}
