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
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.session.dto.ExamQuestionResponseDTO;
import com.gr1.exam.module.session.dto.ExamSessionResponseDTO;
import com.gr1.exam.module.session.dto.QuestionAnswerSubmissionDTO;
import com.gr1.exam.module.session.dto.SubmitSessionRequestDTO;
import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.entity.UserAnswer;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import com.gr1.exam.module.session.repository.UserAnswerRepository;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExamSessionServiceTest {

    @Mock
    private ExamSessionRepository examSessionRepository;
    @Mock
    private ExamVariantRepository examVariantRepository;
    @Mock
    private ExamVariantQuestionRepository examVariantQuestionRepository;
    @Mock
    private ExamVariantAnswerRepository examVariantAnswerRepository;
    @Mock
    private UserAnswerRepository userAnswerRepository;
    @Mock
    private ExamRepository examRepository;
    @Mock
    private ExamParticipantRepository examParticipantRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GradingService gradingService;

    @InjectMocks
    private ExamSessionService examSessionService;

    @Test
    void startSession_shouldAssignVariantAndSave_whenValid() {
        Exam exam = buildOngoingExam(1);
        User user = buildStudent(10, "student01");
        ExamVariant variant = buildVariant(100, exam, 0, true);

        when(examRepository.findById(1)).thenReturn(Optional.of(exam));
        when(userRepository.findById(10)).thenReturn(Optional.of(user));
        when(examParticipantRepository.existsByExamIdAndUserId(1, 10)).thenReturn(true);
        when(examSessionRepository.findByExamIdAndUserIdAndStatus(1, 10, ExamSession.Status.DOING))
                .thenReturn(Optional.empty());
        when(examVariantRepository.findByExamId(1)).thenReturn(List.of(variant));
        when(examSessionRepository.save(any(ExamSession.class))).thenAnswer(invocation -> {
            ExamSession saved = invocation.getArgument(0);
            saved.setId(1000);
            if (saved.getStatus() == null) {
                saved.setStatus(ExamSession.Status.DOING);
            }
            if (saved.getStartTime() == null) {
                saved.setStartTime(LocalDateTime.now());
            }
            return saved;
        });

        ExamSessionResponseDTO result = examSessionService.startSession(1, 10);

        assertThat(result.getId()).isEqualTo(1000);
        assertThat(result.getExamId()).isEqualTo(1);
        assertThat(result.getUserId()).isEqualTo(10);
        assertThat(result.getStatus()).isEqualTo("DOING");

        ArgumentCaptor<ExamSession> captor = ArgumentCaptor.forClass(ExamSession.class);
        verify(examSessionRepository).save(captor.capture());
        assertThat(captor.getValue().getVariant().getId()).isEqualTo(100);
    }

    @Test
    void startSession_shouldThrowBadRequest_whenNoVariantAvailable() {
        Exam exam = buildOngoingExam(1);
        User user = buildStudent(10, "student01");

        when(examRepository.findById(1)).thenReturn(Optional.of(exam));
        when(userRepository.findById(10)).thenReturn(Optional.of(user));
        when(examParticipantRepository.existsByExamIdAndUserId(1, 10)).thenReturn(true);
        when(examSessionRepository.findByExamIdAndUserIdAndStatus(1, 10, ExamSession.Status.DOING))
                .thenReturn(Optional.empty());
        when(examSessionRepository.existsByExamIdAndUserIdAndStatus(1, 10, ExamSession.Status.SUBMITTED))
                .thenReturn(false);
        when(examVariantRepository.findByExamId(1)).thenReturn(List.of());

        assertThatThrownBy(() -> examSessionService.startSession(1, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chưa có đề thi nào");

        verify(examSessionRepository, never()).save(any(ExamSession.class));
    }

    @Test
    void startSession_shouldThrowBadRequest_whenExamNotOngoing() {
        Exam exam = buildOngoingExam(1);
        exam.setStartTime(LocalDateTime.now().plusMinutes(30));
        User user = buildStudent(10, "student01");

        when(examRepository.findById(1)).thenReturn(Optional.of(exam));
        when(userRepository.findById(10)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> examSessionService.startSession(1, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Kỳ thi chưa bắt đầu");
    }

    @Test
    void startSession_shouldRejectRepeatAttempt_whenAlreadySubmitted() {
        Exam exam = buildOngoingExam(1);
        User user = buildStudent(10, "student01");

        when(examRepository.findById(1)).thenReturn(Optional.of(exam));
        when(userRepository.findById(10)).thenReturn(Optional.of(user));
        when(examParticipantRepository.existsByExamIdAndUserId(1, 10)).thenReturn(true);
        when(examSessionRepository.findByExamIdAndUserIdAndStatus(1, 10, ExamSession.Status.DOING))
                .thenReturn(Optional.empty());
        when(examSessionRepository.existsByExamIdAndUserIdAndStatus(1, 10, ExamSession.Status.SUBMITTED))
                .thenReturn(true);

        assertThatThrownBy(() -> examSessionService.startSession(1, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thể thi lại");

        verify(examSessionRepository, never()).save(any(ExamSession.class));
    }

    @Test
    void getQuestions_shouldReturnVariantQuestionPayload_whenDoingSessionOwnedByCaller() {
        Subject subject = buildSubject(1);
        Chapter chapter = buildChapter(11, subject);
        Exam exam = buildOngoingExam(1);
        User user = buildStudent(10, "student01");
        ExamVariant variant = buildVariant(100, exam, 0, true);

        Question q1 = buildQuestion(21, "Question 1", subject, chapter, "q1.png");
        Answer a1 = buildAnswer(31, q1, "A", false, "a.png");
        Answer a2 = buildAnswer(32, q1, "B", true, "b.png");
        Answer a3 = buildAnswer(33, q1, "C", true, "c.png");
        q1.setAnswers(List.of(a1, a2, a3));

        ExamVariantQuestion vq1 = buildVariantQuestion(201, variant, q1, 1);
        ExamVariantAnswer va1 = buildVariantAnswer(301, vq1, a1, 1);
        ExamVariantAnswer va2 = buildVariantAnswer(302, vq1, a2, 2);

        ExamSession session = ExamSession.builder()
                .id(500)
                .exam(exam)
                .user(user)
                .variant(variant)
                .status(ExamSession.Status.DOING)
                .build();

        when(examSessionRepository.findById(500)).thenReturn(Optional.of(session));
        when(examVariantQuestionRepository.findByVariantIdOrderByOrderIndex(100)).thenReturn(List.of(vq1));
        when(examVariantAnswerRepository.findByVariantQuestionIdOrderByOrderIndex(201)).thenReturn(List.of(va1, va2));

        List<ExamQuestionResponseDTO> result = examSessionService.getQuestions(500, 10);

        assertThat(result).hasSize(1);
        ExamQuestionResponseDTO question = result.getFirst();
        assertThat(question.getVariantQuestionId()).isEqualTo(201);
        assertThat(question.getContent()).isEqualTo("Question 1");
        assertThat(question.getImageUrl()).isEqualTo("q1.png");
        assertThat(question.getIsMultipleChoice()).isTrue();
        assertThat(question.getAnswers()).hasSize(2);
        assertThat(question.getAnswers().getFirst().getAnswerId()).isEqualTo(31);
    }

    @Test
    void getQuestions_shouldThrowBadRequest_whenSessionNotOwnedByCaller() {
        Exam exam = buildOngoingExam(1);
        User owner = buildStudent(11, "owner");
        ExamVariant variant = buildVariant(100, exam, 0, true);

        ExamSession session = ExamSession.builder()
                .id(500)
                .exam(exam)
                .user(owner)
                .variant(variant)
                .status(ExamSession.Status.DOING)
                .build();

        when(examSessionRepository.findById(500)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> examSessionService.getQuestions(500, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thuộc về bạn");
    }

    @Test
    void submitSession_shouldSaveSelectionsAndGrade_whenValidPayload() {
        Subject subject = buildSubject(1);
        Chapter chapter = buildChapter(11, subject);
        Exam exam = buildOngoingExam(1);
        User user = buildStudent(10, "student01");
        ExamVariant variant = buildVariant(100, exam, 0, true);

        Question q1 = buildQuestion(21, "Question 1", subject, chapter, null);
        Question q2 = buildQuestion(22, "Question 2", subject, chapter, null);

        Answer a1 = buildAnswer(31, q1, "A", true, null);
        Answer a2 = buildAnswer(32, q1, "B", false, null);
        Answer b1 = buildAnswer(41, q2, "A", false, null);
        Answer b2 = buildAnswer(42, q2, "B", true, null);

        q1.setAnswers(List.of(a1, a2));
        q2.setAnswers(List.of(b1, b2));

        ExamVariantQuestion vq1 = buildVariantQuestion(201, variant, q1, 1);
        ExamVariantQuestion vq2 = buildVariantQuestion(202, variant, q2, 2);

        ExamVariantAnswer va11 = buildVariantAnswer(301, vq1, a1, 1);
        ExamVariantAnswer va12 = buildVariantAnswer(302, vq1, a2, 2);
        ExamVariantAnswer va21 = buildVariantAnswer(303, vq2, b1, 1);
        ExamVariantAnswer va22 = buildVariantAnswer(304, vq2, b2, 2);

        ExamSession doingSession = ExamSession.builder()
                .id(500)
                .exam(exam)
                .user(user)
                .variant(variant)
                .status(ExamSession.Status.DOING)
                .startTime(LocalDateTime.now().minusMinutes(15))
                .build();

        when(examSessionRepository.findByIdAndUserIdForUpdate(500, 10)).thenReturn(Optional.of(doingSession));
        when(examVariantQuestionRepository.findByVariantIdOrderByOrderIndex(100)).thenReturn(List.of(vq1, vq2));
        when(examVariantAnswerRepository.findByVariantQuestionIdOrderByOrderIndex(201)).thenReturn(List.of(va11, va12));
        when(examVariantAnswerRepository.findByVariantQuestionIdOrderByOrderIndex(202)).thenReturn(List.of(va21, va22));
        when(userAnswerRepository.findByVariantQuestionId(201)).thenReturn(Optional.empty());
        when(userAnswerRepository.findByVariantQuestionId(202)).thenReturn(Optional.empty());
        when(examSessionRepository.save(any(ExamSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of(
                answerSubmission(201, List.of(31)),
                answerSubmission(202, List.of(42))
        ));

        ExamSessionResponseDTO result = examSessionService.submitSession(500, 10, request);

        assertThat(result.getStatus()).isEqualTo("SUBMITTED");
        verify(userAnswerRepository, times(2)).save(any(UserAnswer.class));
        verify(gradingService).grade(500);
    }

    @Test
    void submitSession_shouldRejectDuplicateVariantQuestionInPayload() {
        ExamSession session = buildDoingSessionForSubmit();
        ExamVariantQuestion vq = buildVariantQuestion(201, session.getVariant(), buildQuestion(21, "Q1", buildSubject(1), buildChapter(11, buildSubject(1)), null), 1);

        when(examSessionRepository.findByIdAndUserIdForUpdate(500, 10)).thenReturn(Optional.of(session));
        when(examVariantQuestionRepository.findByVariantIdOrderByOrderIndex(100)).thenReturn(List.of(vq));

        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of(
                answerSubmission(201, List.of(31)),
                answerSubmission(201, List.of(32))
        ));

        assertThatThrownBy(() -> examSessionService.submitSession(500, 10, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("câu hỏi bị lặp");

        verify(userAnswerRepository, never()).save(any(UserAnswer.class));
    }

    @Test
    void submitSession_shouldRejectAnswerOutsideVariantQuestion() {
        Subject subject = buildSubject(1);
        Chapter chapter = buildChapter(11, subject);
        Exam exam = buildOngoingExam(1);
        User user = buildStudent(10, "student01");
        ExamVariant variant = buildVariant(100, exam, 0, true);

        Question q1 = buildQuestion(21, "Question 1", subject, chapter, null);
        Answer a1 = buildAnswer(31, q1, "A", true, null);
        q1.setAnswers(List.of(a1));

        ExamVariantQuestion vq1 = buildVariantQuestion(201, variant, q1, 1);
        ExamVariantAnswer valid = buildVariantAnswer(301, vq1, a1, 1);

        ExamSession doingSession = ExamSession.builder()
                .id(500)
                .exam(exam)
                .user(user)
                .variant(variant)
                .status(ExamSession.Status.DOING)
                .build();

        when(examSessionRepository.findByIdAndUserIdForUpdate(500, 10)).thenReturn(Optional.of(doingSession));
        when(examVariantQuestionRepository.findByVariantIdOrderByOrderIndex(100)).thenReturn(List.of(vq1));
        when(examVariantAnswerRepository.findByVariantQuestionIdOrderByOrderIndex(201)).thenReturn(List.of(valid));

        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of(answerSubmission(201, List.of(999))));

        assertThatThrownBy(() -> examSessionService.submitSession(500, 10, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thuộc câu hỏi 201");

        verify(userAnswerRepository, never()).save(any(UserAnswer.class));
    }

    @Test
    void submitSession_shouldThrowWhenAlreadySubmitted() {
        Subject subject = buildSubject(1);
        Exam exam = buildOngoingExam(1);
        User user = buildStudent(10, "student01");
        ExamVariant variant = buildVariant(100, exam, 0, true);

        ExamSession submitted = ExamSession.builder()
                .id(500)
                .exam(exam)
                .user(user)
                .variant(variant)
                .status(ExamSession.Status.SUBMITTED)
                .build();

        when(examSessionRepository.findByIdAndUserIdForUpdate(500, 10)).thenReturn(Optional.of(submitted));

        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of());

        assertThatThrownBy(() -> examSessionService.submitSession(500, 10, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("đã được nộp trước đó");
    }

    @Test
    void submitSession_shouldThrowWhenSessionMissing() {
        when(examSessionRepository.findByIdAndUserIdForUpdate(999, 10)).thenReturn(Optional.empty());

        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of());

        assertThatThrownBy(() -> examSessionService.submitSession(999, 10, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Phiên thi không tìm thấy");
    }

    private SubmitSessionRequestDTO buildSubmitRequest(Integer variantQuestionId, Integer answerId) {
        SubmitSessionRequestDTO request = new SubmitSessionRequestDTO();
        request.setAnswers(List.of(answerSubmission(variantQuestionId, List.of(answerId))));
        return request;
    }

    private QuestionAnswerSubmissionDTO answerSubmission(Integer variantQuestionId, List<Integer> answerIds) {
        QuestionAnswerSubmissionDTO dto = new QuestionAnswerSubmissionDTO();
        dto.setVariantQuestionId(variantQuestionId);
        dto.setSelectedAnswerIds(answerIds);
        return dto;
    }

    private Subject buildSubject(Integer id) {
        return Subject.builder().id(id).name("Toan").build();
    }

    private Chapter buildChapter(Integer id, Subject subject) {
        return Chapter.builder().id(id).name("Chuong 1").subject(subject).build();
    }

    private User buildStudent(Integer id, String username) {
        return User.builder()
                .id(id)
                .username(username)
                .name("Student")
                .role(User.Role.STUDENT)
                .password("encoded")
                .build();
    }

    private Exam buildOngoingExam(Integer id) {
        return Exam.builder()
                .id(id)
                .title("Exam")
                .subject(buildSubject(1))
                .duration(45)
                .totalQuestions(2)
                .totalVariants(1)
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now().plusHours(1))
                .build();
    }

    private ExamVariant buildVariant(Integer id, Exam exam, Integer order, Boolean isOriginal) {
        return ExamVariant.builder()
                .id(id)
                .exam(exam)
                .variantOrder(order)
                .isOriginal(isOriginal)
                .build();
    }

    private Question buildQuestion(Integer id, String content, Subject subject, Chapter chapter, String imageUrl) {
        return Question.builder()
                .id(id)
                .content(content)
                .subject(subject)
                .chapter(chapter)
                .imageUrl(imageUrl)
                .build();
    }

    private Answer buildAnswer(Integer id, Question question, String content, Boolean isCorrect, String imageUrl) {
        return Answer.builder()
                .id(id)
                .question(question)
                .content(content)
                .isCorrect(isCorrect)
                .imageUrl(imageUrl)
                .build();
    }

    private ExamVariantQuestion buildVariantQuestion(Integer id, ExamVariant variant, Question question, Integer orderIndex) {
        return ExamVariantQuestion.builder()
                .id(id)
                .variant(variant)
                .question(question)
                .orderIndex(orderIndex)
                .build();
    }

    private ExamVariantAnswer buildVariantAnswer(Integer id, ExamVariantQuestion vq, Answer answer, Integer orderIndex) {
        return ExamVariantAnswer.builder()
                .id(id)
                .variantQuestion(vq)
                .answer(answer)
                .orderIndex(orderIndex)
                .build();
    }

    private ExamSession buildDoingSessionForSubmit() {
        Exam exam = buildOngoingExam(1);
        User user = buildStudent(10, "student01");
        ExamVariant variant = buildVariant(100, exam, 0, true);
        return ExamSession.builder()
                .id(500)
                .exam(exam)
                .user(user)
                .variant(variant)
                .status(ExamSession.Status.DOING)
                .startTime(LocalDateTime.now().minusMinutes(10))
                .build();
    }
}