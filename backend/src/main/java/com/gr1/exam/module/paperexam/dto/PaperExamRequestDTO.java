package com.gr1.exam.module.paperexam.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class PaperExamRequestDTO {

    @NotBlank(message = "Tiêu đề đề giấy không được để trống")
    private String title;

    @NotNull(message = "Môn học không được để trống")
    private Integer subjectId;

    @NotNull(message = "Thời lượng không được để trống")
    @Positive(message = "Thời lượng phải lớn hơn 0")
    private Integer durationMinutes;

    @NotNull(message = "Tổng số câu hỏi không được để trống")
    @Positive(message = "Tổng số câu hỏi phải lớn hơn 0")
    private Integer totalQuestions;

    @NotNull(message = "Danh sách cấu hình chương không được để trống")
    @Size(min = 1, message = "Phải có ít nhất 1 cấu hình chương")
    @Valid
    private List<PaperExamChapterConfigRequestDTO> chapterConfigs = new ArrayList<>();
}
