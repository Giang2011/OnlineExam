package com.gr1.exam.module.session.service;

import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.exam.entity.ExamVariant;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import com.gr1.exam.module.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test cho {@link SessionDeadlineScheduler}.
 *
 * <p>Regression test cho bug {@code LazyInitializationException}: scheduler phải chạy
 * trong transaction để các lazy proxy (exam, user) được khởi tạo hợp lệ.
 */
@ExtendWith(MockitoExtension.class)
class SessionDeadlineSchedulerTest {

    @Mock
    private ExamSessionRepository examSessionRepository;
    @Mock
    private ExamSessionService examSessionService;

    @InjectMocks
    private SessionDeadlineScheduler scheduler;

    @Test
    void autoSubmitExpiredSessions_shouldDoNothing_whenNoCandidateSessions() {
        when(examSessionRepository.findExpiredDoingSessions(any(), any()))
                .thenReturn(List.of());

        scheduler.autoSubmitExpiredSessions();

        verify(examSessionService, never()).autoSubmit(any(), any());
    }

    @Test
    void autoSubmitExpiredSessions_shouldSkipCandidatesStillWithinGraceWindow() {
        ExamSession session = buildSession(500, LocalDateTime.now().minusSeconds(30));

        when(examSessionRepository.findExpiredDoingSessions(any(), any()))
                .thenReturn(List.of(session));
        // isExpired() = false (còn trong cửa sổ gia hạn) → không tự nộp.
        when(examSessionService.isExpired(session)).thenReturn(false);

        scheduler.autoSubmitExpiredSessions();

        verify(examSessionService, never()).autoSubmit(any(), any());
    }

    @Test
    void autoSubmitExpiredSessions_shouldAutoSubmit_whenExpired() {
        ExamSession session = buildSession(500, LocalDateTime.now().minusHours(2));

        when(examSessionRepository.findExpiredDoingSessions(any(), any()))
                .thenReturn(List.of(session));
        when(examSessionService.isExpired(session)).thenReturn(true);

        scheduler.autoSubmitExpiredSessions();

        verify(examSessionService).autoSubmit(session, ExamSession.SubmitSource.TIMEOUT);
    }

    private ExamSession buildSession(Integer id, LocalDateTime deadlineAt) {
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Exam exam = Exam.builder()
                .id(1)
                .title("Exam")
                .subject(subject)
                .duration(45)
                .totalQuestions(2)
                .totalVariants(1)
                .startTime(LocalDateTime.now().minusHours(3))
                .endTime(LocalDateTime.now().plusHours(1))
                .build();
        ExamVariant variant = ExamVariant.builder().id(100).exam(exam).variantOrder(0).isOriginal(true).build();
        User user = User.builder().id(10).username("student01").name("Student")
                .role(User.Role.STUDENT).password("encoded").build();

        return ExamSession.builder()
                .id(id)
                .exam(exam)
                .user(user)
                .variant(variant)
                .status(ExamSession.Status.DOING)
                .attemptNo(1)
                .startTime(LocalDateTime.now().minusHours(3))
                .deadlineAt(deadlineAt)
                .build();
    }
}
