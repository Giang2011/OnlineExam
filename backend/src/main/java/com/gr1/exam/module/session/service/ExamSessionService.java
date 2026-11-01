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
import com.gr1.exam.module.exam.service.ExamService;
import com.gr1.exam.module.grading.service.GradingService;
import com.gr1.exam.module.session.dto.*;
import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.entity.UserAnswer;
import com.gr1.exam.module.session.entity.UserAnswerSelection;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import com.gr1.exam.module.session.repository.UserAnswerRepository;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ★ Service cốt lõi: Quản lý phiên thi, gán variant, autosave, nộp bài. ★
 *
 * <p>Nguyên tắc: server là nguồn sự thật về thời gian. Mọi response trả về đều kèm
 * {@code serverTime} + {@code remainingSeconds} để FE chỉ hiển thị, không tự đếm ngược.
 */
@Slf4j
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

    /** Cửa sổ gia hạn (giây) sau hạn chót — dùng khi bài ngắn, cấu hình tối đa. */
    @Value("${app.session.submit-grace-seconds:120}")
    private int graceSeconds = 120;

    // ==================== Start / Resume ====================

    /**
     * Bắt đầu phiên thi — gán random 1 variant đã tráo sẵn.
     *
     * <p>Nếu user đang có phiên {@code DOING} thì <b>trả lại phiên đó</b> (resume) thay vì
     * báo lỗi — nhờ đó đóng trình duyệt rồi quay lại vẫn làm tiếp được.
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

        // ★ Resume: đang có phiên DOING → trả lại phiên cũ (không mất đáp án đã autosave).
        Optional<ExamSession> existingDoing = examSessionRepository
                .findByExamIdAndUserIdAndStatus(examId, userId, ExamSession.Status.DOING);
        if (existingDoing.isPresent()) {
            ExamSession session = existingDoing.get();
            // Nếu phiên cũ đã quá hạn (kể cả grace) → tự nộp rồi cho phép thi lượt mới.
            if (isExpired(session)) {
                autoSubmit(session, ExamSession.SubmitSource.TIMEOUT);
                // Không resume phiên đã hết hạn — kiểm tra lượt thi còn lại bên dưới.
            } else {
                session.setSubmitSource(ExamSession.SubmitSource.RESUME);
                session = examSessionRepository.save(session);
                return toSessionResponseDTO(session);
            }
        }

        // ★ Kiểm tra số lượt thi tối đa
        int maxAttempts = ExamService.effectiveMaxAttempts(exam);
        long usedAttempts = examSessionRepository
                .countByExamIdAndUserIdAndStatus(examId, userId, ExamSession.Status.SUBMITTED);
        if (usedAttempts >= maxAttempts) {
            throw new BadRequestException("Bạn đã hết lượt thi của kỳ thi này (tối đa "
                    + maxAttempts + " lượt).");
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
                .attemptNo((int) usedAttempts + 1)
                .startTime(LocalDateTime.now())
                .build();
        session.setDeadlineAt(computeDeadline(exam, session.getStartTime()));
        session = examSessionRepository.save(session);

        return toSessionResponseDTO(session);
    }

    // ==================== Đọc đề ====================

    /**
     * Lấy đề thi — từ variant đã gán, đọc nội dung từ snapshot (fallback entity live nếu chưa có snapshot).
     */
    public List<ExamQuestionResponseDTO> getQuestions(Integer sessionId, Integer userId) {
        ExamSession session = getValidDoingSession(sessionId, userId);
        ExamVariant variant = session.getVariant();

        List<ExamVariantQuestion> vQuestions = examVariantQuestionRepository
                .findByVariantIdOrderByOrderIndex(variant.getId());

        return vQuestions.stream().map(vq -> {
            List<ExamVariantAnswer> vAnswers = examVariantAnswerRepository
                    .findByVariantQuestionIdOrderByOrderIndex(vq.getId());

            // ★ Đọc từ snapshot; fallback về entity live cho dữ liệu cũ (chưa backfill).
            // `safe*` bọc try/catch vì câu hỏi/đáp án đã bị soft-delete sẽ không
            // resolve được proxy → EntityNotFoundException nếu truy cập trực tiếp.
            String content = vq.getContentSnapshot() != null
                    ? vq.getContentSnapshot()
                    : safeQuestionContent(vq);
            String imageUrl = vq.getContentSnapshot() != null
                    ? vq.getImageUrlSnapshot()
                    : safeQuestionImageUrl(vq);

            Boolean isMultipleChoice = vq.getMultiChoiceSnapshot();
            if (isMultipleChoice == null || vq.getContentSnapshot() == null) {
                // Dữ liệu cũ chưa backfill → tính lại từ entity live.
                isMultipleChoice = countLiveCorrectAnswers(vq) > 1;
            }

            return ExamQuestionResponseDTO.builder()
                    .variantQuestionId(vq.getId())
                    .orderIndex(vq.getOrderIndex())
                    .content(content)
                    .imageUrl(imageUrl)
                    .isMultipleChoice(isMultipleChoice)
                    .answers(vAnswers.stream().map(va -> ExamQuestionResponseDTO.ShuffledAnswerDTO.builder()
                            .answerId(va.getAnswer() == null ? null : va.getAnswer().getId())
                            .content(va.getContentSnapshot() != null
                                    ? va.getContentSnapshot()
                                    : safeAnswerContent(va))
                            .imageUrl(va.getContentSnapshot() != null
                                    ? va.getImageUrlSnapshot()
                                    : safeAnswerImageUrl(va))
                            .orderIndex(va.getOrderIndex())
                            .build()
                    ).collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());
    }

    // ==================== Truy cập entity live (an toàn) ====================

    /**
     * Đọc nội dung câu hỏi live — trả về {@code null} nếu câu hỏi đã bị soft-delete.
     */
    private String safeQuestionContent(ExamVariantQuestion vq) {
        try {
            return vq.getQuestion() == null ? null : vq.getQuestion().getContent();
        } catch (RuntimeException e) {
            log.debug("[ExamSessionService] Không đọc được câu hỏi live (đã xoá): {}", vq.getId());
            return null;
        }
    }

    /**
     * Đọc ảnh minh hoạ câu hỏi live — trả về {@code null} nếu câu hỏi đã bị soft-delete.
     */
    private String safeQuestionImageUrl(ExamVariantQuestion vq) {
        try {
            return vq.getQuestion() == null ? null : vq.getQuestion().getImageUrl();
        } catch (RuntimeException e) {
            return null;
        }
    }

    /**
     * Đếm số đáp án đúng live — trả về 0 nếu câu hỏi đã bị soft-delete.
     */
    private long countLiveCorrectAnswers(ExamVariantQuestion vq) {
        try {
            if (vq.getQuestion() == null || vq.getQuestion().getAnswers() == null) {
                return 0;
            }
            return vq.getQuestion().getAnswers().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                    .count();
        } catch (RuntimeException e) {
            return 0;
        }
    }

    /**
     * Đọc nội dung đáp án live — trả về {@code null} nếu đáp án đã bị soft-delete.
     */
    private String safeAnswerContent(ExamVariantAnswer va) {
        try {
            return va.getAnswer() == null ? null : va.getAnswer().getContent();
        } catch (RuntimeException e) {
            return null;
        }
    }

    /**
     * Đọc ảnh minh hoạ đáp án live — trả về {@code null} nếu đáp án đã bị soft-delete.
     */
    private String safeAnswerImageUrl(ExamVariantAnswer va) {
        try {
            return va.getAnswer() == null ? null : va.getAnswer().getImageUrl();
        } catch (RuntimeException e) {
            return null;
        }
    }

    /**
     * Đọc ID đáp án gốc — trả về {@code null} nếu đáp án đã bị soft-delete.
     */
    private Integer safeAnswerId(ExamVariantAnswer va) {
        try {
            return va.getAnswer() == null ? null : va.getAnswer().getId();
        } catch (RuntimeException e) {
            return null;
        }
    }

    /**
     * Đọc ID đáp án đã chọn — trả về {@code null} nếu đáp án đã bị soft-delete.
     */
    private Integer safeSelectedAnswerId(UserAnswerSelection sel) {
        try {
            return sel.getSelectedAnswer() == null ? null : sel.getSelectedAnswer().getId();
        } catch (RuntimeException e) {
            return null;
        }
    }

    // ==================== Autosave ====================

    /**
     * Autosave đáp án — upsert, KHÔNG chấm điểm, KHÔNG đổi trạng thái phiên.
     * Dùng cho cơ chế "đóng tab giữa chừng → mở lại vẫn giữ bài".
     */
    @Transactional
    public SessionAnswersResponseDTO saveAnswers(Integer sessionId, Integer userId, SaveAnswersRequestDTO dto) {
        ExamSession session = getValidDoingSession(sessionId, userId);

        // Lazy check: nếu đã quá hạn thì tự nộp, không nhận thêm đáp án.
        if (isExpired(session)) {
            autoSubmit(session, ExamSession.SubmitSource.TIMEOUT);
            throw new BadRequestException("Đã quá thời gian thi, bài đã được hệ thống tự nộp.");
        }

        List<ExamVariantQuestion> variantQuestions = examVariantQuestionRepository
                .findByVariantIdOrderByOrderIndex(session.getVariant().getId());

        Map<Integer, ExamVariantQuestion> questionById = variantQuestions.stream()
                .collect(Collectors.toMap(ExamVariantQuestion::getId, q -> q));

        Set<Integer> uniqueQuestionIds = new HashSet<>();
        for (QuestionAnswerSubmissionDTO answer : dto.getAnswers()) {
            Integer questionId = answer.getVariantQuestionId();
            if (!uniqueQuestionIds.add(questionId)) {
                throw new BadRequestException("Danh sách đáp án chứa câu hỏi bị lặp: " + questionId);
            }
            if (!questionById.containsKey(questionId)) {
                throw new BadRequestException("Câu hỏi không thuộc phiên thi: " + questionId);
            }
        }

        for (QuestionAnswerSubmissionDTO answer : dto.getAnswers()) {
            upsertAnswerSelection(session, questionById.get(answer.getVariantQuestionId()),
                    answer.getSelectedAnswerIds());
        }

        session.setLastSavedAt(LocalDateTime.now());
        examSessionRepository.save(session);

        return getAnswers(sessionId, userId);
    }

    /**
     * Lấy đáp án draft đã autosave của phiên.
     */
    @Transactional(readOnly = true)
    public SessionAnswersResponseDTO getAnswers(Integer sessionId, Integer userId) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên thi không tìm thấy với id: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new BadRequestException("Phiên thi không thuộc về bạn.");
        }

        List<UserAnswer> userAnswers = userAnswerRepository.findByExamSessionId(sessionId);

        List<SessionAnswersResponseDTO.SavedAnswerDTO> answers = userAnswers.stream()
                .map(ua -> SessionAnswersResponseDTO.SavedAnswerDTO.builder()
                        .variantQuestionId(ua.getVariantQuestion().getId())
                        .selectedAnswerIds(ua.getSelectedAnswers().stream()
                                .map(sel -> safeSelectedAnswerId(sel))
                                .filter(Objects::nonNull)
                                .collect(Collectors.toList()))
                        .build())
                .sorted(Comparator.comparing(SessionAnswersResponseDTO.SavedAnswerDTO::getVariantQuestionId))
                .toList();

        return SessionAnswersResponseDTO.builder()
                .sessionId(sessionId)
                .attemptNo(session.getAttemptNo())
                .answers(answers)
                .build();
    }

    // ==================== Đọc trạng thái phiên ====================

    /**
     * Phiên DOING hiện tại của user — dùng để FE khôi phục sau khi đóng trình duyệt.
     */
    @Transactional(readOnly = true)
    public ActiveSessionResponseDTO getActiveSession(Integer userId) {
        List<ExamSession> doing = examSessionRepository.findDoingSessionsByUserId(userId, ExamSession.Status.DOING);
        if (doing.isEmpty()) {
            return null;
        }
        ExamSession session = doing.get(0);
        LocalDateTime now = LocalDateTime.now();
        return ActiveSessionResponseDTO.builder()
                .sessionId(session.getId())
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .attemptNo(session.getAttemptNo())
                .status(session.getStatus().name())
                .startTime(session.getStartTime())
                .deadlineAt(session.getDeadlineAt())
                .serverTime(now)
                .remainingSeconds(remainingSeconds(session, now))
                .build();
    }

    /**
     * Chi tiết phiên thi.
     */
    @Transactional(readOnly = true)
    public SessionDetailResponseDTO getSessionDetail(Integer sessionId, Integer userId) {
        ExamSession session = examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên thi không tìm thấy với id: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new BadRequestException("Phiên thi không thuộc về bạn.");
        }

        Exam exam = session.getExam();
        int maxAttempts = ExamService.effectiveMaxAttempts(exam);
        long used = examSessionRepository.countByExamIdAndUserIdAndStatus(
                exam.getId(), userId, ExamSession.Status.SUBMITTED);

        LocalDateTime now = LocalDateTime.now();
        return SessionDetailResponseDTO.builder()
                .sessionId(session.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .attemptNo(session.getAttemptNo())
                .maxAttempts(maxAttempts)
                .status(session.getStatus().name())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .deadlineAt(session.getDeadlineAt())
                .serverTime(now)
                .remainingSeconds(remainingSeconds(session, now))
                .submitSource(session.getSubmitSource() == null ? null : session.getSubmitSource().name())
                .attemptsExhausted(used >= maxAttempts)
                .build();
    }

    // ==================== Submit ====================

    /**
     * Nộp bài.
     */
    @Transactional
    public ExamSessionResponseDTO submitSession(Integer sessionId, Integer userId, SubmitSessionRequestDTO dto) {
        ExamSession session = examSessionRepository.findByIdAndUserIdForUpdate(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Phiên thi không tìm thấy với id: " + sessionId));

        if (session.getStatus() == ExamSession.Status.SUBMITTED) {
            throw new BadRequestException("Phiên thi đã được nộp trước đó.");
        }

        LocalDateTime now = LocalDateTime.now();
        ExamSession.SubmitSource source = resolveSubmitSource(session, now);

        if (source == null) {
            // Quá hạn (kể cả grace) → tự nộp bằng draft đã autosave rồi từ chối.
            autoSubmit(session, ExamSession.SubmitSource.TIMEOUT);
            throw new BadRequestException("Đã quá thời gian thi, bài đã được hệ thống tự nộp.");
        }

        saveSubmittedAnswers(session, dto);

        session.setStatus(ExamSession.Status.SUBMITTED);
        session.setEndTime(now);
        session.setSubmitSource(source);
        session = examSessionRepository.save(session);

        gradingService.grade(sessionId);

        return toSessionResponseDTO(session);
    }

    /**
     * Tự nộp bài bằng draft đã autosave — dùng khi hết giờ (scheduler) hoặc khi thí sinh
     * bấm nộp quá hạn.
     */
    @Transactional
    public void autoSubmit(ExamSession session, ExamSession.SubmitSource source) {
        if (session.getStatus() == ExamSession.Status.SUBMITTED) {
            return;
        }
        session.setStatus(ExamSession.Status.SUBMITTED);
        session.setEndTime(LocalDateTime.now());
        session.setSubmitSource(source);
        examSessionRepository.save(session);
        gradingService.grade(session.getId());
    }

    // ==================== Helpers ====================

    /**
     * Xác định nguồn nộp bài dựa trên deadline:
     * <ul>
     *     <li>Còn thời gian → MANUAL</li>
     *     <li>Quá hạn nhưng còn trong cửa sổ gia hạn → GRACE</li>
     *     <li>Quá hạn cả grace → {@code null} (bị từ chối, đã tự nộp)</li>
     * </ul>
     */
    private ExamSession.SubmitSource resolveSubmitSource(ExamSession session, LocalDateTime now) {
        LocalDateTime deadline = session.getDeadlineAt();
        if (deadline == null) {
            return ExamSession.SubmitSource.MANUAL;
        }
        if (!now.isAfter(deadline)) {
            return ExamSession.SubmitSource.MANUAL;
        }
        if (!now.isAfter(deadline.plusSeconds(graceSecondsFor(session)))) {
            return ExamSession.SubmitSource.GRACE;
        }
        return null;
    }

    /**
     * Phiên đã quá hạn (deadline + grace đã trôi qua) → không nhận thao tác nữa.
     */
    public boolean isExpired(ExamSession session) {
        LocalDateTime deadline = session.getDeadlineAt();
        if (deadline == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(deadline.plusSeconds(graceSecondsFor(session)));
    }

    /**
     * Cửa sổ gia hạn = min(300s, max(15s, duration * 5%)).
     */
    private int graceSecondsFor(ExamSession session) {
        Integer duration = session.getExam() == null ? null : session.getExam().getDuration();
        if (duration == null || duration <= 0) {
            return graceSeconds;
        }
        int proportional = (int) Math.round(duration * 60.0 * 0.05);
        return Math.min(300, Math.max(15, Math.min(graceSeconds, proportional)));
    }

    /**
     * Hạn chót server-side = min(startTime + duration, exam.endTime).
     */
    private LocalDateTime computeDeadline(Exam exam, LocalDateTime startTime) {
        LocalDateTime byDuration = startTime.plusMinutes(exam.getDuration());
        LocalDateTime examEnd = exam.getEndTime();
        if (examEnd == null) {
            return byDuration;
        }
        return byDuration.isBefore(examEnd) ? byDuration : examEnd;
    }

    private Long remainingSeconds(ExamSession session, LocalDateTime now) {
        LocalDateTime deadline = session.getDeadlineAt();
        if (deadline == null) {
            return null;
        }
        return Duration.between(now, deadline).getSeconds();
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

    /**
     * Upsert đáp án đã chọn cho 1 câu — dùng chung cho autosave và submit.
     */
    private void upsertAnswerSelection(ExamSession session, ExamVariantQuestion variantQuestion, List<Integer> selectedAnswerIds) {
        List<Integer> normalizedIds = selectedAnswerIds == null ? new ArrayList<>() : selectedAnswerIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        // Validate selected answers belong to this variant question
        if (!normalizedIds.isEmpty()) {
            List<ExamVariantAnswer> vAnswers = examVariantAnswerRepository
                    .findByVariantQuestionIdOrderByOrderIndex(variantQuestion.getId());
            // Đáp án đã bị soft-delete sẽ không resolve được proxy → bỏ qua,
            // tránh EntityNotFoundException làm hỏng cả request autosave.
            Set<Integer> validAnswerIds = vAnswers.stream()
                    .map(va -> safeAnswerId(va))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            for (Integer answerId : normalizedIds) {
                if (!validAnswerIds.contains(answerId)) {
                    throw new BadRequestException("Đáp án " + answerId + " không thuộc câu hỏi " + variantQuestion.getId());
                }
            }
        }

        UserAnswer userAnswer = userAnswerRepository
                .findFirstByExamSessionIdAndVariantQuestionId(session.getId(), variantQuestion.getId())
                .orElse(UserAnswer.builder()
                        .examSession(session)
                        .variantQuestion(variantQuestion)
                        .build());

        // ★ Xoá lựa chọn cũ TRƯỚC KHI insert lựa chọn mới.
        // `collection.clear()` chỉ đánh dấu xoá — Hibernate ghi DELETE lúc flush.
        // Nếu không flush ngay, DELETE sẽ chạy SAU các INSERT → vi phạm unique
        // constraint (user_answer_id, selected_answer_id).
        if (!userAnswer.getSelectedAnswers().isEmpty()) {
            userAnswer.getSelectedAnswers().clear();
            userAnswerRepository.flush();
        }

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
        LocalDateTime now = LocalDateTime.now();
        return ExamSessionResponseDTO.builder()
                .id(session.getId())
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .userId(session.getUser().getId())
                .userName(session.getUser().getName())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus().name())
                .attemptNo(session.getAttemptNo())
                .deadlineAt(session.getDeadlineAt())
                .serverTime(now)
                .remainingSeconds(remainingSeconds(session, now))
                .submitSource(session.getSubmitSource() == null ? null : session.getSubmitSource().name())
                .build();
    }
}
