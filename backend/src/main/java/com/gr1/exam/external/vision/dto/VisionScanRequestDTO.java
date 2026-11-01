package com.gr1.exam.external.vision.dto;

import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * Request gửi sang vision service để đọc phiếu trả lời.
 */
@Data
@Builder
public class VisionScanRequestDTO {
    private Integer paperExamId;
    private MultipartFile image;
    private Integer actualQuestionCount;
    private Integer formVariant; // luôn là 75 ở giai đoạn đầu
    private Boolean debug;
    private String scanMode;
}
