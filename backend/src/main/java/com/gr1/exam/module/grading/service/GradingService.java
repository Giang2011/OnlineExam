package com.gr1.exam.module.grading.service;

import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.exam.entity.ExamVariantQuestion;
import com.gr1.exam.module.exam.repository.ExamVariantQuestionRepository;
import com.gr1.exam.module.grading.dto.ExamResultsResponseDTO;
import com.gr1.exam.module.grading.dto.ResultResponseDTO;
import com.gr1.exam.module.grading.entity.Result;
import com.gr1.exam.module.grading.repository.ResultRepository;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.repository.AnswerRepository;
import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.entity.UserAnswer;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import com.gr1.exam.module.session.repository.UserAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service chấm điểm tự động và thống kê kết quả.
 */
@Service
@RequiredArgsConstructor
public class GradingService {

    private final ResultRepository resultRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final ExamSessionRepository examSessionRepository;
    private final ExamVariantQuestionRepository examVariantQuestionRepository;
    private final AnswerRepository answerRepository;

    @Transactional
    public ResultResponseDTO grade(Integer examSessionId) {
        ExamSession examSession = examSessionRepository.findById(examSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên thi không tìm thấy với id: " + examSessionId));

        Result existing = resultRepository.findByExamSessionId(examSessionId).orElse(null);

        // Lấy variant questions từ variant đã gán
        List<ExamVariantQuestion> variantQuestions = examVariantQuestionRepository
                .findByVariantIdOrderByOrderIndex(examSession.getVariant().getId());
        int totalQuestions = variantQuestions.size();

        // Load đáp án đúng theo question gốc
        Map<Integer, Set<Integer>> correctAnswerIdsByQuestionId = loadCorrectAnswerIdsByQuestion(variantQuestions);
        // Load đáp án user đã chọn
        Map<Integer, Set<Integer>> selectedAnswerIdsByVarQuestion = loadSelectedAnswerIdsByVarQuestion(examSessionId);

        int totalCorrect = 0;
        for (ExamVariantQuestion vq : variantQuestions) {
            Integer questionId = vq.getQuestion().getId();
            Set<Integer> correctSet = correctAnswerIdsByQuestionId.getOrDefault(questionId, Set.of());
            Set<Integer> selectedSet = selectedAnswerIdsByVarQuestion.getOrDefault(vq.getId(), Set.of());
            if (correctSet.equals(selectedSet)) {
                totalCorrect++;
            }
        }

        float score = totalQuestions == 0 ? 0.0f : ((float) totalCorrect / (float) totalQuestions) * 10.0f;

        Result result = existing == null
                ? Result.builder().examSession(examSession).build()
                : existing;

        result.setScore(score);
        result.setTotalCorrect(totalCorrect);
        result.setSubmittedAt(LocalDateTime.now());

        result = resultRepository.save(result);
        return toResultResponseDTO(result, totalQuestions, null);
    }

    @Transactional(readOnly = true)
    public ResultResponseDTO getResultBySession(Integer sessionId) {
        Result result = resultRepository.findByExamSessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Kết quả không tìm thấy cho sessionId: " + sessionId));
        int totalQuestions = result.getExamSession().getExam().getTotalQuestions();
        return toResultResponseDTO(result, totalQuestions, null);
    }

    @Transactional(readOnly = true)
    public List<ResultResponseDTO> getMyResults(Integer userId) {
        List<Result> results = resultRepository.findByExamSessionUserId(userId);
        return results.stream()
                .sorted(Comparator.comparing((Result r) -> r.getSubmittedAt() == null ? LocalDateTime.MIN : r.getSubmittedAt())
                        .reversed())
                .map(result -> toResultResponseDTO(result, result.getExamSession().getExam().getTotalQuestions(), null))
                .toList();
    }

    @Transactional(readOnly = true)
    public ExamResultsResponseDTO getResultsByExam(Integer examId) {
        List<Result> results = resultRepository.findByExamSessionExamId(examId);

        if (results.isEmpty()) {
            ExamSession anySession = examSessionRepository.findByExamId(examId).stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + examId));
            return ExamResultsResponseDTO.builder()
                    .examId(examId)
                    .examTitle(anySession.getExam().getTitle())
                    .statistics(emptyStats())
                    .results(new ArrayList<>())
                    .build();
        }

        List<Result> sorted = results.stream()
                .sorted(Comparator.comparing(Result::getScore, Comparator.nullsFirst(Comparator.reverseOrder()))
                        .thenComparing(Result::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        List<ResultResponseDTO> responseResults = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            Result result = sorted.get(i);
            responseResults.add(toResultResponseDTO(result, result.getExamSession().getExam().getTotalQuestions(), i + 1));
        }

        float average = (float) sorted.stream().mapToDouble(r -> r.getScore() == null ? 0.0 : r.getScore()).average()
                .orElse(0.0);
        float highest = (float) sorted.stream().mapToDouble(r -> r.getScore() == null ? 0.0 : r.getScore()).max().orElse(0.0);
        float lowest = (float) sorted.stream().mapToDouble(r -> r.getScore() == null ? 0.0 : r.getScore()).min().orElse(0.0);

        ExamResultsResponseDTO.ScoreDistributionDTO distribution = buildDistribution(sorted);

        return ExamResultsResponseDTO.builder()
                .examId(examId)
                .examTitle(sorted.getFirst().getExamSession().getExam().getTitle())
                .statistics(ExamResultsResponseDTO.StatisticsDTO.builder()
                        .average(average)
                        .highest(highest)
                        .lowest(lowest)
                        .totalSubmitted(sorted.size())
                        .distribution(distribution)
                        .build())
                .results(responseResults)
                .build();
    }

    private Map<Integer, Set<Integer>> loadCorrectAnswerIdsByQuestion(List<ExamVariantQuestion> variantQuestions) {
        List<Integer> questionIds = variantQuestions.stream()
                .map(vq -> vq.getQuestion().getId())
                .distinct()
                .toList();

        List<Answer> correctAnswers = questionIds.isEmpty()
                ? new ArrayList<>()
                : answerRepository.findByQuestionIdInAndIsCorrectTrue(questionIds);

        Map<Integer, Set<Integer>> correctByQuestion = new HashMap<>();
        for (Answer answer : correctAnswers) {
            Integer questionId = answer.getQuestion().getId();
            correctByQuestion.computeIfAbsent(questionId, k -> new HashSet<>()).add(answer.getId());
        }
        return correctByQuestion;
    }

    private Map<Integer, Set<Integer>> loadSelectedAnswerIdsByVarQuestion(Integer examSessionId) {
        List<UserAnswer> userAnswers = userAnswerRepository.findByExamSessionId(examSessionId);
        Map<Integer, Set<Integer>> selectedByVarQuestion = new HashMap<>();
        for (UserAnswer userAnswer : userAnswers) {
            Set<Integer> selectedIds = userAnswer.getSelectedAnswers().stream()
                    .map(selection -> selection.getSelectedAnswer().getId())
                    .collect(Collectors.toSet());
            selectedByVarQuestion.put(userAnswer.getVariantQuestion().getId(), selectedIds);
        }
        return selectedByVarQuestion;
    }

    private ResultResponseDTO toResultResponseDTO(Result result, Integer totalQuestions, Integer rank) {
        return ResultResponseDTO.builder()
                .id(result.getId())
                .rank(rank)
                .examSessionId(result.getExamSession().getId())
                .examTitle(result.getExamSession().getExam().getTitle())
                .studentName(result.getExamSession().getUser().getName())
                .score(result.getScore())
                .totalCorrect(result.getTotalCorrect())
                .totalQuestions(totalQuestions)
                .submittedAt(result.getSubmittedAt())
                .build();
    }

    private ExamResultsResponseDTO.StatisticsDTO emptyStats() {
        return ExamResultsResponseDTO.StatisticsDTO.builder()
                .average(0.0f)
                .highest(0.0f)
                .lowest(0.0f)
                .totalSubmitted(0)
                .distribution(ExamResultsResponseDTO.ScoreDistributionDTO.builder()
                        .from0To2(0)
                        .from2To4(0)
                        .from4To6(0)
                        .from6To8(0)
                        .from8To10(0)
                        .build())
                .build();
    }

    private ExamResultsResponseDTO.ScoreDistributionDTO buildDistribution(List<Result> results) {
        int from0To2 = 0, from2To4 = 0, from4To6 = 0, from6To8 = 0, from8To10 = 0;

        for (Result result : results) {
            float score = result.getScore() == null ? 0.0f : result.getScore();
            if (score < 2.0f) from0To2++;
            else if (score < 4.0f) from2To4++;
            else if (score < 6.0f) from4To6++;
            else if (score < 8.0f) from6To8++;
            else from8To10++;
        }

        return ExamResultsResponseDTO.ScoreDistributionDTO.builder()
                .from0To2(from0To2).from2To4(from2To4).from4To6(from4To6)
                .from6To8(from6To8).from8To10(from8To10)
                .build();
    }
}
