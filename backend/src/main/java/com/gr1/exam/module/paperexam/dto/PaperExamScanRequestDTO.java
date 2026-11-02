package com.gr1.exam.module.paperexam.dto;

import lombok.Data;

/**
 * Request chấm phiếu OMR.
 *
 * Một bài làm có thể gồm nhiều trang; ảnh được gửi qua `images[]` (multipart).
 */
@Data
public class PaperExamScanRequestDTO {
    private Integer actualQuestionCount;
    private Boolean debug = Boolean.FALSE;
    private String scanMode = "AUTO";
}
