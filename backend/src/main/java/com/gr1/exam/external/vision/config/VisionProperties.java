package com.gr1.exam.external.vision.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình cho vision service (SheetScanner OMR service).
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.vision")
public class VisionProperties {
    private String serviceUrl = "http://localhost:8000";
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 30000;
    private boolean enabled = true;

    /**
     * Layout OMR mặc định (JSON). Dùng khi đề giấy chưa lưu layout riêng.
     * Các field tương ứng với `SheetScanner/omr/config.py::Layout`.
     */
    private String omrLayout = "{\"bubble_radius\":16,\"choice_spacing\":64,\"row_spacing\":56," +
            "\"margin_top\":330,\"margin_left\":150,\"page_width\":850,\"page_height\":1100," +
            "\"marker_size\":80,\"marker_margin\":30}";

    /**
     * Số câu trên mỗi trang phiếu OMR khi đề giấy chưa lưu layout riêng.
     */
    private int defaultQuestionsPerPage = 14;

    /**
     * Số lựa chọn tối đa trên mỗi câu (A..E là 5).
     */
    private int defaultChoicesPerQ = 5;

    /**
     * Ngưỡng coi một ô là đã được tô (tỉ lệ pixel đen trong ô).
     *
     * <p>Được gửi kèm sang engine để cả hai tầng dùng chung một tham số — nếu
     * mỗi tầng tự đặt ngưỡng riêng thì ảnh khoanh và bảng kết quả có thể lệch nhau.
     */
    private double fillThreshold = 0.45;

    /**
     * Ngưỡng cách biệt giữa hai ô để coi là "tô mơ hồ" (cần người kiểm tra lại).
     */
    private double ambiguityMargin = 0.12;

    /**
     * Dưới ngưỡng này thì câu đó bị coi là "cần xem lại".
     *
     * <p>Mặc định bằng {@link #fillThreshold}: một ô mà engine đã coi là đã tô thì
     * độ tin cậy cũng phải tương ứng, nếu không ảnh khoanh (xanh) và bảng kết quả
     * ("Cần xem lại") sẽ trái nhau.
     */
    private double confidenceThreshold = 0.45;
}
