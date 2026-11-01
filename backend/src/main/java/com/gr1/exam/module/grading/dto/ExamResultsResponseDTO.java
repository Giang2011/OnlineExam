package com.gr1.exam.module.grading.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ExamResultsResponseDTO {
    private Integer examId;
    private String examTitle;
    private StatisticsDTO statistics;
    private List<ResultResponseDTO> results;

    @Data
    @Builder
    public static class StatisticsDTO {
        private Float average;
        private Float highest;
        private Float lowest;
        private Integer totalSubmitted;
        private ScoreDistributionDTO distribution;
    }

    @Data
    @Builder
    public static class ScoreDistributionDTO {
        private Integer from0To2;
        private Integer from2To4;
        private Integer from4To6;
        private Integer from6To8;
        private Integer from8To10;
    }
}
