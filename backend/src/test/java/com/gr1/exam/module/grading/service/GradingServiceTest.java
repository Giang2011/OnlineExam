package com.gr1.exam.module.grading.service;

import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.exam.entity.ExamVariant;
import com.gr1.exam.module.exam.entity.ExamVariantQuestion;
import com.gr1.exam.module.exam.repository.ExamVariantQuestionRepository;
import com.gr1.exam.module.grading.dto.ExamResultsResponseDTO;
import com.gr1.exam.module.grading.dto.ResultResponseDTO;
import com.gr1.exam.module.grading.entity.Result;
import com.gr1.exam.module.grading.repository.ResultRepository;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.AnswerRepository;
import com.gr1.exam.module.session.entity.ExamSession;
import com.gr1.exam.module.session.entity.UserAnswer;
import com.gr1.exam.module.session.entity.UserAnswerSelection;
import com.gr1.exam.module.session.repository.ExamSessionRepository;
import com.gr1.exam.module.session.repository.UserAnswerRepository;
import com.gr1.exam.module.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GradingServiceTest {

    @Mock
    private ResultRepository resultRepository;

    @Mock
    private UserAnswerRepository userAnswerRepository;

    @Mock
    private ExamSessionRepository examSessionRepository;

    @Mock
    private ExamVariantQuestionRepository examVariantQuestionRepository;

    @Mock
    private AnswerRepository answerRepository;

    @InjectMocks
    private GradingService gradingService;

    @Test
    void grade_shouldRequireExactSetMatchForMultipleCorrect() {
        Subject subject = Subject.builder().id(1).name("Math").build();
        Question question = Question.builder().id(11).subject(subject).content("Q").build();

        Answer correct1 = Answer.builder().id(101).question(question).isCorrect(true).content("A").build();
        Answer correct2 = Answer.builder().id(102).question(question).isCorrect(true).content("B").build();
        Answer wrong = Answer.builder().id(103).question(question).isCorrect(false).content("C").build();

        User user = User.builder().id(10).username("student10").name("student").password("x").role(User.Role.STUDENT).build();
        Exam exam = Exam.builder().id(5).title("Exam").subject(subject).totalQuestions(1).duration(30).build();
        ExamVariant variant = ExamVariant.builder().id(301).exam(exam).variantOrder(1).isOriginal(false).build();
        ExamSession session = ExamSession.builder()
                .id(1)
                .exam(exam)
                .user(user)
                .variant(variant)
                .status(ExamSession.Status.SUBMITTED)
                .build();
        ExamVariantQuestion variantQuestion = ExamVariantQuestion.builder()
                .id(201)
                .variant(variant)
                .question(question)
                .orderIndex(1)
                .build();

        UserAnswer userAnswer = UserAnswer.builder()
                .id(401)
                .examSession(session)
                .variantQuestion(variantQuestion)
                .build();
        userAnswer.setSelectedAnswers(List.of(
                UserAnswerSelection.builder().userAnswer(userAnswer).selectedAnswer(correct1).build(),
                UserAnswerSelection.builder().userAnswer(userAnswer).selectedAnswer(wrong).build()
        ));

        when(examSessionRepository.findById(1)).thenReturn(Optional.of(session));
        when(resultRepository.findByExamSessionId(1)).thenReturn(Optional.empty());
        when(examVariantQuestionRepository.findByVariantIdOrderByOrderIndex(301)).thenReturn(List.of(variantQuestion));
        when(answerRepository.findByQuestionIdInAndIsCorrectTrue(List.of(11))).thenReturn(List.of(correct1, correct2));
        when(userAnswerRepository.findByExamSessionId(1)).thenReturn(List.of(userAnswer));
        when(resultRepository.save(any(Result.class))).thenAnswer(invocation -> {
            Result saved = invocation.getArgument(0);
            saved.setId(999);
            return saved;
        });

        ResultResponseDTO response = gradingService.grade(1);

        assertThat(response.getId()).isEqualTo(999);
        assertThat(response.getTotalQuestions()).isEqualTo(1);
        assertThat(response.getTotalCorrect()).isEqualTo(0);
        assertThat(response.getScore()).isEqualTo(0.0f);
    }

    @Test
    void getResultsByExam_shouldBuildStatisticsAndRanking() {
        Subject subject = Subject.builder().id(1).name("Math").build();
        Exam exam = Exam.builder().id(5).title("Exam").subject(subject).totalQuestions(10).duration(30).build();

        User u1 = User.builder().id(1).username("a").name("A").build();
        User u2 = User.builder().id(2).username("b").name("B").build();

        ExamSession s1 = ExamSession.builder().id(11).exam(exam).user(u1).status(ExamSession.Status.SUBMITTED).build();
        ExamSession s2 = ExamSession.builder().id(12).exam(exam).user(u2).status(ExamSession.Status.SUBMITTED).build();

        Result r1 = Result.builder()
                .id(100)
                .examSession(s1)
                .score(9.0f)
                .totalCorrect(9)
                .submittedAt(LocalDateTime.now())
                .build();
        Result r2 = Result.builder()
                .id(101)
                .examSession(s2)
                .score(6.0f)
                .totalCorrect(6)
                .submittedAt(LocalDateTime.now())
                .build();

        when(resultRepository.findByExamSessionExamId(5)).thenReturn(List.of(r2, r1));

        ExamResultsResponseDTO response = gradingService.getResultsByExam(5);

        assertThat(response.getExamId()).isEqualTo(5);
        assertThat(response.getStatistics().getAverage()).isEqualTo(7.5f);
        assertThat(response.getStatistics().getHighest()).isEqualTo(9.0f);
        assertThat(response.getStatistics().getLowest()).isEqualTo(6.0f);
        assertThat(response.getStatistics().getTotalSubmitted()).isEqualTo(2);
        assertThat(response.getStatistics().getDistribution().getFrom6To8()).isEqualTo(1);
        assertThat(response.getStatistics().getDistribution().getFrom8To10()).isEqualTo(1);

        assertThat(response.getResults()).hasSize(2);
        assertThat(response.getResults().getFirst().getStudentName()).isEqualTo("A");
        assertThat(response.getResults().getFirst().getRank()).isEqualTo(1);
    }

    @Test
    void getResultsByExam_shouldReturnEmptyStats_whenNoSubmittedResults() {
        Subject subject = Subject.builder().id(1).name("Math").build();
        Exam exam = Exam.builder().id(5).title("Exam Empty").subject(subject).totalQuestions(10).duration(30).build();
        User u1 = User.builder().id(1).username("a").name("A").build();
        ExamSession session = ExamSession.builder().id(11).exam(exam).user(u1).status(ExamSession.Status.DOING).build();

        when(resultRepository.findByExamSessionExamId(5)).thenReturn(List.of());
        when(examSessionRepository.findByExamId(5)).thenReturn(List.of(session));

        ExamResultsResponseDTO response = gradingService.getResultsByExam(5);

        assertThat(response.getExamTitle()).isEqualTo("Exam Empty");
        assertThat(response.getResults()).isEmpty();
        assertThat(response.getStatistics().getAverage()).isEqualTo(0.0f);
        assertThat(response.getStatistics().getTotalSubmitted()).isEqualTo(0);
    }
}
