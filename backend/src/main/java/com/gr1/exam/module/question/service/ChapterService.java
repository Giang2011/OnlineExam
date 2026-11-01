package com.gr1.exam.module.question.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.module.question.dto.ChapterRequestDTO;
import com.gr1.exam.module.question.dto.ChapterResponseDTO;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.ChapterRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service CRUD chương cho môn học.
 */
@Service
@RequiredArgsConstructor
public class ChapterService {

    private final ChapterRepository chapterRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;

    /**
     * Danh sách chương của môn học.
     */
    public List<ChapterResponseDTO> getChaptersBySubject(Integer subjectId) {
        subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + subjectId));

        return chapterRepository.findBySubjectIdOrderByIdAsc(subjectId)
                .stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Tạo chương mới cho môn học.
     */
    public ChapterResponseDTO createChapter(Integer subjectId, ChapterRequestDTO request) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + subjectId));

        Chapter chapter = Chapter.builder()
                .subject(subject)
                .name(request.getName())
                .build();

        Chapter saved = chapterRepository.save(chapter);
        return toResponseDTO(saved);
    }

    /**
     * Cập nhật chương.
     */
    public ChapterResponseDTO updateChapter(Integer subjectId, Integer id, ChapterRequestDTO request) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chương không tìm thấy với id: " + id));

        if (!chapter.getSubject().getId().equals(subjectId)) {
            throw new BadRequestException("Chương không thuộc môn học này.");
        }

        chapter.setName(request.getName());

        Chapter updated = chapterRepository.save(chapter);
        return toResponseDTO(updated);
    }

    /**
     * Xoá chương (soft delete).
     */
    public void deleteChapter(Integer subjectId, Integer id) {
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chương không tìm thấy với id: " + id));

        if (!chapter.getSubject().getId().equals(subjectId)) {
            throw new BadRequestException("Chương không thuộc môn học này.");
        }

        long questionCount = questionRepository.countByChapterId(id);
        if (questionCount > 0) {
            throw new BadRequestException(
                    "Không thể xoá chương \"" + chapter.getName() + "\" vì còn " + questionCount + " câu hỏi thuộc chương này.");
        }

        chapterRepository.delete(chapter);
    }

    // ==================== Helper ====================

    private ChapterResponseDTO toResponseDTO(Chapter chapter) {
        return ChapterResponseDTO.builder()
                .id(chapter.getId())
                .subjectId(chapter.getSubject().getId())
                .name(chapter.getName())
                .questionCount(questionRepository.countByChapterId(chapter.getId()))
                .build();
    }
}
