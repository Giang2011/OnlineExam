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

    /** Số lựa chọn trên mỗi câu (số cột ô tô). */
    private Integer choicesPerQ;

    /** Số câu trên mỗi trang phiếu — quyết định offset câu toàn cục. */
    private Integer questionsPerPage;

    /** Layout OMR dạng JSON; null thì dùng layout mặc định trong VisionProperties. */
    private String layout;

    /**
     * Chỉ số trang (0-based) do backend gợi ý. Engine tự đọc QR để biết chính xác
     * đang chấm trang nào; giá trị này chỉ là fallback khi QR không đọc được.
     */
    private Integer pageIndex;

    private Boolean debug;
    private String scanMode;
}
