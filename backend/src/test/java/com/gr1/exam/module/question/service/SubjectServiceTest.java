package com.gr1.exam.module.question.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.question.dto.SubjectRequestDTO;
import com.gr1.exam.module.question.dto.SubjectResponseDTO;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.ChapterRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubjectServiceTest {

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private ChapterRepository chapterRepository;

    @InjectMocks
    private SubjectService subjectService;

    @Test
    void createSubject_shouldReturnCreatedSubject() {
        SubjectRequestDTO request = new SubjectRequestDTO();
        request.setName("Toan");

        when(chapterRepository.findBySubjectIdOrderByIdAsc(1)).thenReturn(java.util.List.of());

        when(subjectRepository.save(org.mockito.ArgumentMatchers.any(Subject.class)))
                .thenAnswer(invocation -> {
                    Subject subject = invocation.getArgument(0);
                    subject.setId(1);
                    return subject;
                });

        SubjectResponseDTO result = subjectService.createSubject(request);

        assertThat(result.getId()).isEqualTo(1);
        assertThat(result.getName()).isEqualTo("Toan");
    }

    @Test
    void getSubjectById_shouldThrowNotFound_whenMissing() {
        when(subjectRepository.findById(100)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> subjectService.getSubjectById(100))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Môn học không tìm thấy với id: 100");
    }

    @Test
    void deleteSubject_shouldThrowBadRequest_whenSubjectHasQuestions() {
        Subject subject = Subject.builder().id(2).name("Ly").build();
        when(subjectRepository.findById(2)).thenReturn(Optional.of(subject));
        when(questionRepository.countBySubjectId(2)).thenReturn(5L);

        assertThatThrownBy(() -> subjectService.deleteSubject(2))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể xoá môn học");

        verify(subjectRepository, never()).delete(subject);
    }
}
