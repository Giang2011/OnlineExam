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

    /**
     * Đáp án đúng của từng câu, JSON string: {@code [["B"], ["A","C"]]}.
     *
     * <p>Mảng 0-based theo thứ tự câu trong đề, nên {@code answerKey[0]} là câu 1.
     * Gửi kèm để engine vẽ được ảnh đã khoanh; engine vẫn chỉ *đọc* ảnh và
     * không tự quyết định đúng/sai — backend là nguồn sự thật cho việc chấm.
     */
    private String answerKey;

    /**
     * Ngưỡng đọc ô tô, JSON string: {@code {"fillThreshold":0.45,"ambiguityMargin":0.12}}.
     *
     * <p>Gửi kèm để hai tầng cùng dùng một tham số, tránh việc ảnh khoanh và bảng
     * kết quả bị lệch nhau do dùng hai ngưỡng khác nhau.
     */
    private String thresholds;

    private Boolean debug;
    private String scanMode;
}
