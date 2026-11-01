package com.gr1.exam.module.paperexam.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.paperexam.dto.PaperExamChapterConfigRequestDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamPreviewResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamRequestDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamResponseDTO;
import com.gr1.exam.module.paperexam.entity.PaperExam;
import com.gr1.exam.module.paperexam.entity.PaperExamChapterConfig;
import com.gr1.exam.module.paperexam.entity.PaperExamQuestion;
import com.gr1.exam.module.paperexam.repository.PaperExamAnswerRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamChapterConfigRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamQueryRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamQuestionRepository;
import com.gr1.exam.module.paperexam.repository.PaperExamRepository;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.ChapterRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaperExamServiceTest {

    @Mock
    private PaperExamRepository paperExamRepository;
    @Mock
    private PaperExamChapterConfigRepository paperExamChapterConfigRepository;
    @Mock
    private PaperExamQuestionRepository paperExamQuestionRepository;
    @Mock
    private PaperExamAnswerRepository paperExamAnswerRepository;
    @Mock
    private PaperExamQueryRepository paperExamQueryRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private ChapterRepository chapterRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PaperExamService paperExamService;

    @Test
    void createPaperExam_shouldThrowNotFound_whenSubjectMissing() {
        PaperExamRequestDTO request = buildRequest();
        when(subjectRepository.findById(1)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paperExamService.createPaperExam(request, 100))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Môn học không tìm thấy với id: 1");
    }

    @Test
    void createPaperExam_shouldThrowNotFound_whenCreatorMissing() {
        PaperExamRequestDTO request = buildRequest();
        Subject subject = Subject.builder().id(1).name("Toán").build();

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(userRepository.findById(100)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paperExamService.createPaperExam(request, 100))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Người tạo không tìm thấy với id: 100");
    }

    @Test
    void createPaperExam_shouldThrowBadRequest_whenDuplicateChapterConfig() {
        PaperExamRequestDTO request = buildRequest();
        request.setChapterConfigs(List.of(config(11, 1), config(11, 1)));
        request.setTotalQuestions(2);

        Subject subject = Subject.builder().id(1).name("Toán").build();
        User creator = User.builder().id(100).name("Admin").build();
        Chapter chapter = Chapter.builder().id(11).name("Chương 1").subject(subject).build();

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(userRepository.findById(100)).thenReturn(Optional.of(creator));
        when(chapterRepository.findById(11)).thenReturn(Optional.of(chapter));
        when(questionRepository.countBySubjectIdAndChapterId(1, 11)).thenReturn(2L);

        assertThatThrownBy(() -> paperExamService.createPaperExam(request, 100))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Mỗi chương chỉ được xuất hiện một lần");
    }

    @Test
    void createPaperExam_shouldThrowBadRequest_whenTotalQuestionsMismatch() {
        PaperExamRequestDTO request = buildRequest();
        request.setTotalQuestions(5);

        Subject subject = Subject.builder().id(1).name("Toán").build();
        User creator = User.builder().id(100).name("Admin").build();
        Chapter chapter = Chapter.builder().id(11).name("Chương 1").subject(subject).build();

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(userRepository.findById(100)).thenReturn(Optional.of(creator));
        when(chapterRepository.findById(11)).thenReturn(Optional.of(chapter));
        when(questionRepository.countBySubjectIdAndChapterId(1, 11)).thenReturn(3L);

        assertThatThrownBy(() -> paperExamService.createPaperExam(request, 100))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Tổng số câu theo chương (2) phải bằng tổng số câu hỏi của đề (5)");

        verify(paperExamRepository, never()).save(any(PaperExam.class));
    }

    @Test
    void createPaperExam_shouldReturnResponse_whenValidRequest() {
        PaperExamRequestDTO request = buildRequest();

        Subject subject = Subject.builder().id(1).name("Toán").build();
        User creator = User.builder().id(100).name("Admin").build();
        Chapter chapter = Chapter.builder().id(11).name("Chương 1").subject(subject).build();

        Question q1 = Question.builder().id(201).content("Q1").chapter(chapter).subject(subject).answers(List.of()).build();
        Question q2 = Question.builder().id(202).content("Q2").chapter(chapter).subject(subject).answers(List.of()).build();

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(userRepository.findById(100)).thenReturn(Optional.of(creator));
        when(chapterRepository.findById(11)).thenReturn(Optional.of(chapter));
        when(questionRepository.countBySubjectIdAndChapterId(1, 11)).thenReturn(5L);

        when(paperExamRepository.save(any(PaperExam.class))).thenAnswer(inv -> {
            PaperExam exam = inv.getArgument(0);
            exam.setId(501);
            return exam;
        });

        when(paperExamChapterConfigRepository.save(any(PaperExamChapterConfig.class))).thenAnswer(inv -> {
            PaperExamChapterConfig cfg = inv.getArgument(0);
            cfg.setId(601);
            return cfg;
        });

        when(paperExamQueryRepository.findRandomableQuestionsBySubjectAndChapter(eq(1), eq(11))).thenReturn(List.of(q1, q2));
        when(paperExamQuestionRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
        when(paperExamChapterConfigRepository.findByPaperExamId(501)).thenReturn(List.of(
                PaperExamChapterConfig.builder().id(601).chapter(chapter).questionCount(2).build()
        ));

        PaperExamResponseDTO result = paperExamService.createPaperExam(request, 100);

        assertThat(result.getId()).isEqualTo(501);
        assertThat(result.getTitle()).isEqualTo("Đề kiểm tra 15 phút");
        assertThat(result.getSubjectId()).isEqualTo(1);
        assertThat(result.getCreatedById()).isEqualTo(100);
        assertThat(result.getChapterConfigs()).hasSize(1);
        verify(paperExamAnswerRepository).saveAll(any());
    }

    @Test
    void getPaperExamPreview_shouldThrowNotFound_whenExamMissing() {
        when(paperExamRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paperExamService.getPaperExamPreview(999))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Đề giấy không tìm thấy với id: 999");
    }

    @Test
    void getPaperExamPreview_shouldReturnPreview_whenExamExists() {
        Subject subject = Subject.builder().id(1).name("Toán").build();
        User creator = User.builder().id(100).name("Admin").build();
        PaperExam exam = PaperExam.builder()
                .id(501)
                .title("Đề kiểm tra")
                .subject(subject)
                .createdBy(creator)
                .durationMinutes(15)
                .totalQuestions(1)
                .showAnswers(true)
                .build();

        Chapter chapter = Chapter.builder().id(11).name("Chương 1").subject(subject).build();
        Question question = Question.builder().id(301).content("2+2=?").chapter(chapter).subject(subject).answers(List.of()).build();
        PaperExamQuestion paperExamQuestion = PaperExamQuestion.builder()
                .id(401)
                .paperExam(exam)
                .question(question)
                .chapter(chapter)
                .orderIndex(1)
                .build();

        when(paperExamRepository.findById(501)).thenReturn(Optional.of(exam));
        when(paperExamQuestionRepository.findByPaperExamIdOrderByOrderIndexAsc(501)).thenReturn(List.of(paperExamQuestion));

        PaperExamPreviewResponseDTO result = paperExamService.getPaperExamPreview(501);

        assertThat(result.getPaperExamId()).isEqualTo(501);
        assertThat(result.getQuestions()).hasSize(1);
        assertThat(result.getQuestions().getFirst().getQuestionId()).isEqualTo(301);
    }

    private PaperExamRequestDTO buildRequest() {
        PaperExamRequestDTO request = new PaperExamRequestDTO();
        request.setTitle("Đề kiểm tra 15 phút");
        request.setSubjectId(1);
        request.setDurationMinutes(15);
        request.setTotalQuestions(2);
        request.setChapterConfigs(List.of(config(11, 2)));
        return request;
    }

    private PaperExamChapterConfigRequestDTO config(Integer chapterId, Integer questionCount) {
        PaperExamChapterConfigRequestDTO dto = new PaperExamChapterConfigRequestDTO();
        dto.setChapterId(chapterId);
        dto.setQuestionCount(questionCount);
        return dto;
    }
}
