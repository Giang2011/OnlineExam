package com.gr1.exam.module.exam.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ExamResponseDTO {
    private Integer id;
    private String title;
    private Integer subjectId;
    private String subjectName;
    private Integer duration;
    private Integer totalQuestions;
    private Integer totalVariants;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;           // UPCOMING, ONGOING, COMPLETED
    private Long participantCount;   // Số thí sinh đã phân công
}
