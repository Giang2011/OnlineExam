package com.gr1.exam.external.vision.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Kết quả nhận diện cho một câu trên phiếu trả lời.
 *
 * `selectedOptions` là *tập* các lựa chọn được tô (A, B, C...), nên hỗ trợ cả câu
 * một đáp án đúng lẫn câu nhiều đáp án đúng. `fillRatios` là tỉ lệ tô thực tế của từng
 * ô (theo thứ tự A, B, C...) — đây là dữ liệu thô từ engine, không phải giá trị
 * suy đoán lại từ text.
 */
@Data
@Builder
public class VisionRecognizedAnswerDTO {
    private Integer questionIndex;
    private List<String> selectedOptions;
    private Boolean isEmpty;
    private Double confidence;
    private Integer markedCount;
    private List<Double> fillRatios;

    /**
     * Trạng thái đọc được từ engine: BLANK / MULTI_MARKED / AMBIGUOUS / READ.
     * Engine chỉ đọc ảnh, không chấm điểm — backend mới là nơi so khớp đáp án.
     */
    private String status;
}
