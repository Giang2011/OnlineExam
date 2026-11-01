package com.gr1.exam.module.question.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.core.utils.FileUploadUtils;
import com.gr1.exam.module.question.dto.QuestionRequestDTO;
import com.gr1.exam.module.question.dto.QuestionResponseDTO;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.ChapterRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private ChapterRepository chapterRepository;

    @Mock
    private FileUploadUtils fileUploadUtils;

    @InjectMocks
    private QuestionService questionService;

    @Test
    void getAllQuestions_shouldUseSubjectChapterKeywordFilter_whenAllProvided() {
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Chapter chapter = Chapter.builder().id(2).name("Dai so").subject(subject).build();
        Question q = Question.builder()
                .id(10)
                .content("2+2=?")
                .subject(subject)
                .chapter(chapter)
                .answers(List.of())
                .build();
        Page<Question> page = new PageImpl<>(List.of(q));

        when(questionRepository.findBySubjectIdAndChapterIdAndContentContainingIgnoreCase(eq(1), eq(2), eq("2+2"), any()))
                .thenReturn(page);

        Page<QuestionResponseDTO> result = questionService.getAllQuestions(1, 2, "2+2", PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().getFirst().getId()).isEqualTo(10);
        verify(questionRepository).findBySubjectIdAndChapterIdAndContentContainingIgnoreCase(eq(1), eq(2), eq("2+2"), any());
    }

    @Test
    void createQuestion_shouldThrowNotFound_whenSubjectMissing() {
        QuestionRequestDTO request = buildValidRequest();
        request.setSubjectId(99);

        when(subjectRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> questionService.createQuestion(request, null, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Môn học không tìm thấy với id: 99");
    }

    @Test
    void createQuestion_shouldThrowNotFound_whenChapterMissing() {
        QuestionRequestDTO request = buildValidRequest();

        Subject subject = Subject.builder().id(1).name("Toan").build();
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(2)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> questionService.createQuestion(request, null, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Chương không tìm thấy với id: 2");
    }

    @Test
    void createQuestion_shouldThrowBadRequest_whenChapterNotBelongToSubject() {
        QuestionRequestDTO request = buildValidRequest();

        Subject subject = Subject.builder().id(1).name("Toan").build();
        Subject otherSubject = Subject.builder().id(9).name("Ly").build();
        Chapter chapter = Chapter.builder().id(2).name("Dong hoc").subject(otherSubject).build();

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(2)).thenReturn(Optional.of(chapter));

        assertThatThrownBy(() -> questionService.createQuestion(request, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thuộc môn học này");
    }

    @Test
    void createQuestion_shouldThrowBadRequest_whenAnswersLessThanTwo() {
        QuestionRequestDTO request = buildValidRequest();
        request.setAnswers(List.of(answer("Only one", true)));

        Subject subject = Subject.builder().id(1).name("Toan").build();
        Chapter chapter = Chapter.builder().id(2).name("Dai so").subject(subject).build();
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(2)).thenReturn(Optional.of(chapter));

        assertThatThrownBy(() -> questionService.createQuestion(request, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ít nhất 2 đáp án");
    }

    @Test
    void createQuestion_shouldThrowBadRequest_whenNoCorrectAnswer() {
        QuestionRequestDTO request = buildValidRequest();
        request.setAnswers(List.of(answer("A", false), answer("B", false)));

        Subject subject = Subject.builder().id(1).name("Toan").build();
        Chapter chapter = Chapter.builder().id(2).name("Dai so").subject(subject).build();
        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(2)).thenReturn(Optional.of(chapter));

        assertThatThrownBy(() -> questionService.createQuestion(request, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("ít nhất 1 đáp án đúng");
    }

    @Test
    void createQuestion_shouldReturnResponse_whenValid() {
        QuestionRequestDTO request = buildValidRequest();
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Chapter chapter = Chapter.builder().id(2).name("Dai so").subject(subject).build();

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(2)).thenReturn(Optional.of(chapter));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question question = invocation.getArgument(0);
            question.setId(20);
            return question;
        });

        QuestionResponseDTO result = questionService.createQuestion(request, null, null);

        assertThat(result.getId()).isEqualTo(20);
        assertThat(result.getContent()).isEqualTo("2 + 2 = ?");
        assertThat(result.getSubjectId()).isEqualTo(1);
        assertThat(result.getChapterId()).isEqualTo(2);
        assertThat(result.getAnswers()).hasSize(2);
    }

    @Test
    void createQuestion_shouldMapImageUrls_whenMultipartImagesProvided() {
        QuestionRequestDTO request = buildValidRequest();
        Subject subject = Subject.builder().id(1).name("Toan").build();
        Chapter chapter = Chapter.builder().id(2).name("Dai so").subject(subject).build();

        MultipartFile questionImage = new MockMultipartFile("questionImage", "question.png", "image/png", "q".getBytes());
        MultipartFile answerImage1 = new MockMultipartFile("answerImages", "a1.png", "image/png", "a1".getBytes());
        MultipartFile answerImage2 = new MockMultipartFile("answerImages", "a2.png", "image/png", "a2".getBytes());

        when(subjectRepository.findById(1)).thenReturn(Optional.of(subject));
        when(chapterRepository.findById(2)).thenReturn(Optional.of(chapter));
        when(fileUploadUtils.uploadImage(questionImage, "questions")).thenReturn("/uploads/questions/question.png");
        when(fileUploadUtils.uploadImage(answerImage1, "answers")).thenReturn("/uploads/answers/a1.png");
        when(fileUploadUtils.uploadImage(answerImage2, "answers")).thenReturn("/uploads/answers/a2.png");
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question question = invocation.getArgument(0);
            question.setId(21);
            return question;
        });

        QuestionResponseDTO result = questionService.createQuestion(request, questionImage, List.of(answerImage1, answerImage2));

        assertThat(result.getId()).isEqualTo(21);
        assertThat(result.getImageUrl()).isEqualTo("/uploads/questions/question.png");
        assertThat(result.getAnswers()).hasSize(2);
        assertThat(result.getAnswers().get(0).getImageUrl()).isEqualTo("/uploads/answers/a1.png");
        assertThat(result.getAnswers().get(1).getImageUrl()).isEqualTo("/uploads/answers/a2.png");
    }

    @Test
    void updateQuestion_shouldThrowNotFound_whenQuestionMissing() {
        QuestionRequestDTO request = buildValidRequest();
        when(questionRepository.findById(55)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> questionService.updateQuestion(55, request, null, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Câu hỏi không tìm thấy với id: 55");
    }

    @Test
    void deleteQuestion_shouldThrowNotFound_whenMissing() {
        when(questionRepository.findById(77)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> questionService.deleteQuestion(77))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Câu hỏi không tìm thấy với id: 77");
    }

    private QuestionRequestDTO buildValidRequest() {
        QuestionRequestDTO request = new QuestionRequestDTO();
        request.setContent("2 + 2 = ?");
        request.setSubjectId(1);
        request.setChapterId(2);
        request.setAnswers(List.of(
                answer("3", false),
                answer("4", true)
        ));
        return request;
    }

    private QuestionRequestDTO.AnswerDTO answer(String content, Boolean isCorrect) {
        QuestionRequestDTO.AnswerDTO answer = new QuestionRequestDTO.AnswerDTO();
        answer.setContent(content);
        answer.setIsCorrect(isCorrect);
        return answer;
    }
}
