package com.gr1.exam.module.session.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ExamSessionResponseDTO {
    private Integer id;
    private Integer examId;
    private String examTitle;
    private Integer userId;
    private String userName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
}
