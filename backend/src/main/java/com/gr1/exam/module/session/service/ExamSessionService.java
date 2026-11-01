package com.gr1.exam.module.session.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.exam.entity.ExamVariant;
import com.gr1.exam.module.exam.entity.ExamVariantAnswer;
import com.gr1.exam.module.exam.entity.ExamVariantQuestion;
import com.gr1.exam.module.exam.repository.ExamParticipantRepository;
import com.gr1.exam.module.exam.repository.ExamRepository;
import com.gr1.exam.module.exam.repository.ExamVariantAnswerRepository;
import com.gr1.exam.module.exam.repository.ExamVariantQuestionRepository;
import com.gr1.exam.module.exam.repository.ExamVariantRepository;
import com.gr1.exam.module.grading.service.GradingService;
import com.gr1.exam.module.session.dto.ExamQuestionResponseDTO;
import com.gr1.exam.module.session.dto.ExamSessionResponseDTO;
import com.gr1.exam.module.session.dto.QuestionAnswerSubmissionDTO;
import com.gr1.exam.module.session.dto.SubmitSessionRequestDTO;
import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.entity.UserAnswer;
import com.gr1.exam.module.session.entity.UserAnswerSelection;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import com.gr1.exam.module.session.repository.UserAnswerRepository;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ★ Service cốt lõi: Quản lý phiên thi, gán variant, nộp bài. ★
 */
@Service
@RequiredArgsConstructor
public class ExamSessionService {

    private final ExamSessionRepository examSessionRepository;
    private final ExamVariantRepository examVariantRepository;
    private final ExamVariantQuestionRepository examVariantQuestionRepository;
    private final ExamVariantAnswerRepository examVariantAnswerRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final ExamRepository examRepository;
    private final ExamParticipantRepository examParticipantRepository;
    private final UserRepository userRepository;
    private final GradingService gradingService;

    /**
     * Bắt đầu phiên thi — gán random 1 variant đã tráo sẵn.
     */
    @Transactional
    public ExamSessionResponseDTO startSession(Integer examId, Integer userId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Kỳ thi không tìm thấy với id: " + examId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với id: " + userId));

        validateExamOngoing(exam);

        if (!examParticipantRepository.existsByExamIdAndUserId(examId, userId)) {
            throw new BadRequestException("User không thuộc danh sách thí sinh của kỳ thi này.");
        }

        examSessionRepository.findByExamIdAndUserIdAndStatus(examId, userId, ExamSession.Status.DOING)
                .ifPresent(s -> {
                    throw new BadRequestException("Bạn đã có phiên thi đang diễn ra cho kỳ thi này.");
                });

        if (examSessionRepository.existsByExamIdAndUserIdAndStatus(examId, userId, ExamSession.Status.SUBMITTED)) {
            throw new BadRequestException("Bạn đã thi kỳ thi này rồi, không thể thi lại.");
        }

        // ★ Random chọn 1 variant đã tráo sẵn
        List<ExamVariant> variants = examVariantRepository.findByExamId(examId);
        if (variants.isEmpty()) {
            throw new BadRequestException("Kỳ thi chưa có đề thi nào được tạo.");
        }
        ExamVariant assignedVariant = variants.get(new Random().nextInt(variants.size()));

        ExamSession session = ExamSession.builder()
                .exam(exam)
                .user(user)
                .variant(assignedVariant)
                .build();
        session = examSessionRepository.save(session);

        return toSessionResponseDTO(session);
    }

    /**
     * Lấy đề thi — từ variant đã gán.
     */
    public List<ExamQuestionResponseDTO> getQuestions(Integer sessionId, Integer userId) {
        ExamSession session = getValidDoingSession(sessionId, userId);
        ExamVariant variant = session.getVariant();

        List<ExamVariantQuestion> vQuestions = examVariantQuestionRepository
                .findByVariantIdOrderByOrderIndex(variant.getId());

        return vQuestions.stream().map(vq -> {
            List<ExamVariantAnswer> vAnswers = examVariantAnswerRepository
                    .findByVariantQuestionIdOrderByOrderIndex(vq.getId());

            long correctCount = vq.getQuestion().getAnswers().stream()
                    .filter(a -> a.getIsCorrect() != null && a.getIsCorrect())
                    .count();
            boolean isMultipleChoice = correctCount > 1;

            return ExamQuestionResponseDTO.builder()
                    .variantQuestionId(vq.getId())
                    .orderIndex(vq.getOrderIndex())
                    .content(vq.getQuestion().getContent())
                    .imageUrl(vq.getQuestion().getImageUrl())
                    .isMultipleChoice(isMultipleChoice)
                    .answers(vAnswers.stream().map(va -> ExamQuestionResponseDTO.ShuffledAnswerDTO.builder()
                            .answerId(va.getAnswer().getId())
                            .content(va.getAnswer().getContent())
                            .imageUrl(va.getAnswer().getImageUrl())
                            .orderIndex(va.getOrderIndex())
                            .build()
                    ).collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Nộp bài one-shot.
     */
    @Transactional
    public ExamSessionResponseDTO submitSession(Integer sessionId, Integer userId, SubmitSessionRequestDTO dto) {
        ExamSession session = examSessionRepository.findByIdAndUserIdForUpdate(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên thi không tìm thấy với id: " + sessionId));

        if (session.getStatus() == ExamSession.Status.SUBMITTED) {
            throw new BadRequestException("Phiên thi đã được nộp trước đó.");
        }

        saveSubmittedAnswers(session, dto);

        session.setStatus(ExamSession.Status.SUBMITTED);
        session.setEndTime(LocalDateTime.now());
        session = examSessionRepository.save(session);

        gradingService.grade(sessionId);

        return toSessionResponseDTO(session);
    }

    private void saveSubmittedAnswers(ExamSession session, SubmitSessionRequestDTO dto) {
        ExamVariant variant = session.getVariant();
        List<ExamVariantQuestion> variantQuestions = examVariantQuestionRepository
                .findByVariantIdOrderByOrderIndex(variant.getId());

        Map<Integer, ExamVariantQuestion> questionById = variantQuestions.stream()
                .collect(Collectors.toMap(ExamVariantQuestion::getId, q -> q));

        Map<Integer, List<Integer>> submittedSelectionsByQuestion = new HashMap<>();
        Set<Integer> uniqueQuestionIds = new HashSet<>();

        for (QuestionAnswerSubmissionDTO answer : dto.getAnswers()) {
            Integer questionId = answer.getVariantQuestionId();
            if (!uniqueQuestionIds.add(questionId)) {
                throw new BadRequestException("Danh sách submit chứa câu hỏi bị lặp: " + questionId);
            }
            if (!questionById.containsKey(questionId)) {
                throw new BadRequestException("Câu hỏi không thuộc phiên thi: " + questionId);
            }

            submittedSelectionsByQuestion.put(questionId,
                    answer.getSelectedAnswerIds() == null ? new ArrayList<>() : answer.getSelectedAnswerIds());
        }

        for (ExamVariantQuestion variantQuestion : variantQuestions) {
            List<Integer> selectedAnswerIds = submittedSelectionsByQuestion
                    .getOrDefault(variantQuestion.getId(), new ArrayList<>());
            upsertAnswerSelection(session, variantQuestion, selectedAnswerIds);
        }
    }

    private void upsertAnswerSelection(ExamSession session, ExamVariantQuestion variantQuestion, List<Integer> selectedAnswerIds) {
        List<Integer> normalizedIds = selectedAnswerIds == null ? new ArrayList<>() : selectedAnswerIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        // Validate selected answers belong to this variant question
        if (!normalizedIds.isEmpty()) {
            List<ExamVariantAnswer> vAnswers = examVariantAnswerRepository
                    .findByVariantQuestionIdOrderByOrderIndex(variantQuestion.getId());
            Set<Integer> validAnswerIds = vAnswers.stream()
                    .map(va -> va.getAnswer().getId())
                    .collect(Collectors.toSet());

            for (Integer answerId : normalizedIds) {
                if (!validAnswerIds.contains(answerId)) {
                    throw new BadRequestException("Đáp án " + answerId + " không thuộc câu hỏi " + variantQuestion.getId());
                }
            }
        }

        UserAnswer userAnswer = userAnswerRepository.findByVariantQuestionId(variantQuestion.getId())
                .orElse(UserAnswer.builder()
                        .examSession(session)
                        .variantQuestion(variantQuestion)
                        .build());

        userAnswer.getSelectedAnswers().clear();
        for (Integer answerId : normalizedIds) {
            userAnswer.getSelectedAnswers().add(UserAnswerSelection.builder()
                    .userAnswer(userAnswer)
                    .selectedAnswer(com.gr1.exam.module.question.entity.Answer.builder().id(answerId).build())
                    .build());
        }

        userAnswerRepository.save(userAnswer);
    }

    private ExamSession getValidDoingSession(Integer sessionId, Integer userId) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên thi không tìm thấy với id: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new BadRequestException("Phiên thi không thuộc về bạn.");
        }

        if (session.getStatus() != ExamSession.Status.DOING) {
            throw new BadRequestException("Phiên thi đã kết thúc.");
        }

        return session;
    }

    private void validateExamOngoing(Exam exam) {
        LocalDateTime now = LocalDateTime.now();
        if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
            throw new BadRequestException("Kỳ thi chưa bắt đầu.");
        }
        if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
            throw new BadRequestException("Kỳ thi đã kết thúc.");
        }
    }

    private ExamSessionResponseDTO toSessionResponseDTO(ExamSession session) {
        return ExamSessionResponseDTO.builder()
                .id(session.getId())
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .userId(session.getUser().getId())
                .userName(session.getUser().getName())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus().name())
                .build();
    }
}
