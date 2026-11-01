package com.gr1.exam.module.exam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExamRequestDTO {

    @NotBlank(message = "Tiêu đề kỳ thi không được để trống")
    private String title;

    @NotNull(message = "Môn học không được để trống")
    private Integer subjectId;

    @NotNull @Positive(message = "Thời lượng phải lớn hơn 0")
    private Integer duration;

    @NotNull @Positive(message = "Số câu hỏi phải lớn hơn 0")
    private Integer totalQuestions;

    @NotNull @Positive(message = "Số đề tráo phải lớn hơn 0")
    private Integer totalVariants;  // Tổng số đề (1 gốc + N-1 tráo)

    @Positive(message = "Số lần thi tối đa phải lớn hơn 0")
    private Integer maxAttempts = 1;  // Số lượt thi tối đa cho mỗi thí sinh (null => 1)

    @NotNull @Size(min = 1, message = "Phải có ít nhất 1 cấu hình chương")
    private List<ChapterConfigDTO> chapterConfigs;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startTime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endTime;
}
