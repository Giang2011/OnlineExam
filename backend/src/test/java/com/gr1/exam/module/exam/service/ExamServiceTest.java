package com.gr1.exam.module.exam.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.exam.dto.ChapterConfigDTO;
import com.gr1.exam.module.exam.dto.ExamParticipantDTO;
import com.gr1.exam.module.exam.dto.ExamRequestDTO;
import com.gr1.exam.module.exam.dto.ExamResponseDTO;
import com.gr1.exam.module.exam.entity.Exam;
import com.gr1.exam.module.exam.entity.ExamChapterConfig;
import com.gr1.exam.module.exam.entity.ExamParticipant;
import com.gr1.exam.module.exam.entity.ExamVariant;
import com.gr1.exam.module.exam.entity.ExamVariantAnswer;
import com.gr1.exam.module.exam.entity.ExamVariantQuestion;
import com.gr1.exam.module.exam.repository.ExamChapterConfigRepository;
import com.gr1.exam.module.exam.repository.ExamParticipantRepository;
import com.gr1.exam.module.exam.repository.ExamRepository;
import com.gr1.exam.module.exam.repository.ExamVariantAnswerRepository;
import com.gr1.exam.module.exam.repository.ExamVariantQuestionRepository;
import com.gr1.exam.module.exam.repository.ExamVariantRepository;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.ChapterRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExamServiceTest {

    @Mock
    private ExamRepository examRepository;
    @Mock
    private ExamParticipantRepository participantRepository;
    @Mock
    private ExamChapterConfigRepository examChapterConfigRepository;
    @Mock
    private ExamVariantRepository examVariantRepository;
    @Mock
    private ExamVariantQuestionRepository examVariantQuestionRepository;
    @Mock
    private ExamVariantAnswerRepository examVariantAnswerRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private ChapterRepository chapterRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExamService examService;

    @Test
    void createExam_shouldCreateOriginalAndShuffledVariants_whenRequestValid() {
        Subject subject = buildSubject(1, "Toan");
        Chapter chapter1 = buildChapter(11, "Chuong 1", subject);
        Chapter chapter2 = buildChapter(12, "Chuong 2", subject);

        Question q1 = buildQuestion(101, chapter1, subject, 2);
        Question q2 = buildQuestion(102, chapter2, subject, 2);

        ExamRequestDTO request = buildValidRequest(List.of(
                chapterConfig(11, 1),
                chapterConfig(12, 1)
        ));

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(11)).thenReturn(Optional.of(chapter1));
        when(chapterRepository.findById(12)).thenReturn(Optional.of(chapter2));
        when(questionRepository.countByChapterId(11)).thenReturn(1L);
        when(questionRepository.countByChapterId(12)).thenReturn(1L);
        when(questionRepository.findByChapterId(11)).thenReturn(List.of(q1));
        when(questionRepository.findByChapterId(12)).thenReturn(List.of(q2));

        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> {
            Exam exam = invocation.getArgument(0);
            exam.setId(999);
            return exam;
        });
        when(examChapterConfigRepository.save(any(ExamChapterConfig.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AtomicInteger variantId = new AtomicInteger(1);
        when(examVariantRepository.save(any(ExamVariant.class))).thenAnswer(invocation -> {
            ExamVariant value = invocation.getArgument(0);
            value.setId(variantId.getAndIncrement());
            return value;
        });

        AtomicInteger variantQuestionId = new AtomicInteger(1);
        when(examVariantQuestionRepository.save(any(ExamVariantQuestion.class))).thenAnswer(invocation -> {
            ExamVariantQuestion value = invocation.getArgument(0);
            value.setId(variantQuestionId.getAndIncrement());
            return value;
        });

        when(examVariantAnswerRepository.save(any(ExamVariantAnswer.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(participantRepository.countByExamId(999)).thenReturn(0L);

        ExamResponseDTO result = examService.createExam(request);

        assertThat(result.getId()).isEqualTo(999);
        assertThat(result.getSubjectName()).isEqualTo("Toan");
        assertThat(result.getTotalQuestions()).isEqualTo(2);
        assertThat(result.getTotalVariants()).isEqualTo(2);
        assertThat(result.getStatus()).isEqualTo("UPCOMING");

        verify(examChapterConfigRepository, times(2)).save(any(ExamChapterConfig.class));
        verify(examVariantRepository, times(2)).save(any(ExamVariant.class));
        verify(examVariantQuestionRepository, times(4)).save(any(ExamVariantQuestion.class));
        verify(examVariantAnswerRepository, times(8)).save(any(ExamVariantAnswer.class));
    }

    @Test
    void createExam_shouldThrowNotFound_whenSubjectMissing() {
        ExamRequestDTO request = buildValidRequest(List.of(chapterConfig(11, 1)));
        request.setSubjectId(99);

        when(subjectRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> examService.createExam(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Môn học không tìm thấy với id: 99");
    }

    @Test
    void createExam_shouldThrowBadRequest_whenChapterNotBelongToSubject() {
        Subject subject1 = buildSubject(1, "Toan");
        Subject subject2 = buildSubject(2, "Ly");
        Chapter chapter = buildChapter(11, "Chuong khac mon", subject2);

        ExamRequestDTO request = buildValidRequest(List.of(chapterConfig(11, 1)));

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject1));
        when(chapterRepository.findById(11)).thenReturn(Optional.of(chapter));

        assertThatThrownBy(() -> examService.createExam(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thuộc môn học này");
    }

    @Test
    void createExam_shouldThrowBadRequest_whenChapterQuestionNotEnough() {
        Subject subject = buildSubject(1, "Toan");
        Chapter chapter = buildChapter(11, "Chuong 1", subject);

        ExamRequestDTO request = buildValidRequest(List.of(chapterConfig(11, 3)));
        request.setTotalQuestions(3);

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(11)).thenReturn(Optional.of(chapter));
        when(questionRepository.countByChapterId(11)).thenReturn(2L);

        assertThatThrownBy(() -> examService.createExam(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("chỉ có 2 câu hỏi");
    }

    @Test
    void createExam_shouldThrowBadRequest_whenTotalFromChaptersMismatch() {
        Subject subject = buildSubject(1, "Toan");
        Chapter chapter = buildChapter(11, "Chuong 1", subject);

        ExamRequestDTO request = buildValidRequest(List.of(chapterConfig(11, 1)));
        request.setTotalQuestions(2);

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(11)).thenReturn(Optional.of(chapter));
        when(questionRepository.countByChapterId(11)).thenReturn(10L);

        assertThatThrownBy(() -> examService.createExam(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tổng số câu từ các chương (1) phải bằng số câu hỏi của kỳ thi (2)");
    }

    @Test
    void createExam_shouldThrowBadRequest_whenInvalidTimeRange() {
        Subject subject = buildSubject(1, "Toan");
        Chapter chapter = buildChapter(11, "Chuong 1", subject);

        ExamRequestDTO request = buildValidRequest(List.of(chapterConfig(11, 1)));
        request.setStartTime(LocalDateTime.now().plusDays(1));
        request.setEndTime(LocalDateTime.now().plusHours(1));

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(11)).thenReturn(Optional.of(chapter));
        when(questionRepository.countByChapterId(11)).thenReturn(1L);

        assertThatThrownBy(() -> examService.createExam(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Thời gian bắt đầu phải trước thời gian kết thúc");
    }

    @Test
    void getAllExams_shouldReturnOnlyAssigned_whenCallerIsStudent() {
        Subject subject = buildSubject(1, "Toan");
        Exam exam = buildUpcomingExam(5, subject);
        User caller = User.builder().id(7).username("stu1").role(User.Role.STUDENT).build();
        ExamParticipant participant = ExamParticipant.builder().id(1).exam(exam).user(caller).build();

        when(userRepository.findByUsername("stu1")).thenReturn(Optional.of(caller));
        when(participantRepository.findByUserId(7)).thenReturn(List.of(participant));
        when(participantRepository.countByExamId(5)).thenReturn(1L);

        List<ExamResponseDTO> result = examService.getAllExams("stu1");

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getId()).isEqualTo(5);
        verify(examRepository, never()).findAll();
    }

    @Test
    void getAllExams_shouldReturnAll_whenCallerIsTeacher() {
        Subject subject = buildSubject(1, "Toan");
        Exam exam1 = buildUpcomingExam(5, subject);
        Exam exam2 = buildUpcomingExam(6, subject);
        User caller = User.builder().id(8).username("teacher1").role(User.Role.TEACHER).build();

        when(userRepository.findByUsername("teacher1")).thenReturn(Optional.of(caller));
        when(examRepository.findAll()).thenReturn(List.of(exam1, exam2));
        when(participantRepository.countByExamId(5)).thenReturn(2L);
        when(participantRepository.countByExamId(6)).thenReturn(3L);

        List<ExamResponseDTO> result = examService.getAllExams("teacher1");

        assertThat(result).hasSize(2);
        assertThat(result).extracting(ExamResponseDTO::getParticipantCount).containsExactly(2L, 3L);
    }

    @Test
    void updateExam_shouldUpdate_whenExamUpcoming() {
        Subject oldSubject = buildSubject(1, "Toan");
        Subject newSubject = buildSubject(2, "Ly");

        Exam existing = buildUpcomingExam(9, oldSubject);
        existing.setDuration(45);
        existing.setTotalQuestions(10);
        existing.setTotalVariants(1);

        ExamRequestDTO request = buildValidRequest(List.of(chapterConfig(11, 1)));
        request.setTitle("Cap nhat");
        request.setSubjectId(2);
        request.setDuration(90);
        request.setTotalQuestions(20);
        request.setTotalVariants(3);

        when(examRepository.findById(9)).thenReturn(Optional.of(existing));
        when(subjectRepository.findById(2)).thenReturn(Optional.of(newSubject));
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(participantRepository.countByExamId(9)).thenReturn(0L);

        ExamResponseDTO result = examService.updateExam(9, request);

        assertThat(result.getTitle()).isEqualTo("Cap nhat");
        assertThat(result.getSubjectName()).isEqualTo("Ly");
        assertThat(result.getDuration()).isEqualTo(90);
        assertThat(result.getTotalVariants()).isEqualTo(3);
    }

    @Test
    void updateExam_shouldThrowBadRequest_whenExamNotUpcoming() {
        Subject subject = buildSubject(1, "Toan");
        Exam existing = Exam.builder()
                .id(5)
                .title("Exam")
                .subject(subject)
                .duration(45)
                .totalQuestions(20)
                .totalVariants(1)
                .startTime(LocalDateTime.now().minusMinutes(10))
                .endTime(LocalDateTime.now().plusMinutes(10))
                .build();

        when(examRepository.findById(5)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> examService.updateExam(5, buildValidRequest(List.of(chapterConfig(11, 1)))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể sửa kỳ thi đang ở trạng thái: ONGOING");
    }

    @Test
    void deleteExam_shouldDelete_whenUpcoming() {
        Subject subject = buildSubject(1, "Toan");
        Exam existing = buildUpcomingExam(6, subject);

        when(examRepository.findById(6)).thenReturn(Optional.of(existing));

        examService.deleteExam(6);

        verify(examRepository).delete(existing);
    }

    @Test
    void deleteExam_shouldThrowBadRequest_whenExamCompleted() {
        Subject subject = buildSubject(1, "Toan");
        Exam existing = Exam.builder()
                .id(6)
                .title("Exam")
                .subject(subject)
                .duration(45)
                .totalQuestions(20)
                .totalVariants(1)
                .startTime(LocalDateTime.now().minusDays(2))
                .endTime(LocalDateTime.now().minusDays(1))
                .build();

        when(examRepository.findById(6)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> examService.deleteExam(6))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể xoá kỳ thi đang ở trạng thái: COMPLETED");
    }

    @Test
    void addParticipant_shouldSave_whenStudentAndNotDuplicate() {
        Subject subject = buildSubject(1, "Toan");
        Exam exam = buildUpcomingExam(7, subject);
        User user = User.builder().id(2).name("student").role(User.Role.STUDENT).build();

        ExamParticipantDTO request = new ExamParticipantDTO();
        request.setUserId(2);

        when(examRepository.findById(7)).thenReturn(Optional.of(exam));
        when(userRepository.findById(2)).thenReturn(Optional.of(user));

        examService.addParticipant(7, request);

        verify(participantRepository).save(any(ExamParticipant.class));
    }

    @Test
    void addParticipant_shouldThrowBadRequest_whenUserNotStudent() {
        Subject subject = buildSubject(1, "Toan");
        Exam exam = buildUpcomingExam(7, subject);
        User user = User.builder().id(2).name("admin").role(User.Role.ADMIN).build();

        ExamParticipantDTO request = new ExamParticipantDTO();
        request.setUserId(2);

        when(examRepository.findById(7)).thenReturn(Optional.of(exam));
        when(userRepository.findById(2)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> examService.addParticipant(7, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Chỉ có thể thêm user có role STUDENT");

        verify(participantRepository, never()).save(any(ExamParticipant.class));
    }

    @Test
    void removeParticipant_shouldDelete_whenParticipantExists() {
        Subject subject = buildSubject(1, "Toan");
        Exam exam = buildUpcomingExam(8, subject);
        User user = User.builder().id(3).name("student").role(User.Role.STUDENT).build();
        ExamParticipant participant = ExamParticipant.builder().id(5).exam(exam).user(user).build();

        when(participantRepository.findByExamIdAndUserId(8, 3)).thenReturn(Optional.of(participant));

        examService.removeParticipant(8, 3);

        verify(participantRepository).delete(participant);
    }

    @Test
    void getParticipants_shouldReturnMappedUsers_whenExamExists() {
        Subject subject = buildSubject(1, "Toan");
        Exam exam = buildUpcomingExam(9, subject);
        User user = User.builder().id(4).username("st-a").name("student-a").studentId("B21").role(User.Role.STUDENT).build();
        ExamParticipant participant = ExamParticipant.builder().id(1).exam(exam).user(user).build();

        when(examRepository.findById(9)).thenReturn(Optional.of(exam));
        when(participantRepository.findByExamId(9)).thenReturn(List.of(participant));

        List<UserResponseDTO> result = examService.getParticipants(9);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getUsername()).isEqualTo("st-a");
        assertThat(result.getFirst().getRole()).isEqualTo("STUDENT");
    }

    private ExamRequestDTO buildValidRequest(List<ChapterConfigDTO> configs) {
        ExamRequestDTO request = new ExamRequestDTO();
        request.setTitle("Kiem tra Toan");
        request.setSubjectId(1);
        request.setDuration(45);
        request.setTotalQuestions(configs.stream().mapToInt(ChapterConfigDTO::getQuestionCount).sum());
        request.setTotalVariants(2);
        request.setChapterConfigs(configs);
        request.setStartTime(LocalDateTime.now().plusDays(1));
        request.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));
        return request;
    }

    private ChapterConfigDTO chapterConfig(Integer chapterId, Integer questionCount) {
        ChapterConfigDTO dto = new ChapterConfigDTO();
        dto.setChapterId(chapterId);
        dto.setQuestionCount(questionCount);
        return dto;
    }

    private Subject buildSubject(Integer id, String name) {
        return Subject.builder().id(id).name(name).build();
    }

    private Chapter buildChapter(Integer id, String name, Subject subject) {
        return Chapter.builder().id(id).name(name).subject(subject).build();
    }

    private Question buildQuestion(Integer id, Chapter chapter, Subject subject, int answerCount) {
        Question question = Question.builder()
                .id(id)
                .content("Question-" + id)
                .chapter(chapter)
                .subject(subject)
                .build();

        List<Answer> answers = java.util.stream.IntStream.rangeClosed(1, answerCount)
                .mapToObj(i -> Answer.builder()
                        .id(id * 10 + i)
                        .question(question)
                        .content("A" + i)
                        .isCorrect(i == 1)
                        .build())
                .toList();

        question.setAnswers(answers);
        return question;
    }

    private Exam buildUpcomingExam(Integer id, Subject subject) {
        return Exam.builder()
                .id(id)
                .title("Exam-" + id)
                .subject(subject)
                .duration(45)
                .totalQuestions(10)
                .totalVariants(2)
                .startTime(LocalDateTime.now().plusHours(2))
                .endTime(LocalDateTime.now().plusHours(4))
                .build();
    }
}
