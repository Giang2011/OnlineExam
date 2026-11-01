package com.gr1.exam.module.question.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.core.utils.FileUploadUtils;
import com.gr1.exam.module.question.dto.QuestionRequestDTO;
import com.gr1.exam.module.question.dto.QuestionResponseDTO;
import com.gr1.exam.module.question.entity.Answer;
import com.gr1.exam.module.question.entity.Chapter;
import com.gr1.exam.module.question.entity.Question;
import com.gr1.exam.module.question.entity.Subject;
import com.gr1.exam.module.question.repository.ChapterRepository;
import com.gr1.exam.module.question.repository.QuestionRepository;
import com.gr1.exam.module.question.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final SubjectRepository subjectRepository;
    private final ChapterRepository chapterRepository;
    private final FileUploadUtils fileUploadUtils;

    /**
     * Lấy danh sách câu hỏi — hỗ trợ filter theo subjectId, chapterId, keyword + phân trang.
     */
    public Page<QuestionResponseDTO> getAllQuestions(Integer subjectId, Integer chapterId, String keyword, Pageable pageable) {
        Page<Question> page = findQuestionsByFilters(subjectId, chapterId, keyword, pageable);

        return page.map(this::toResponseDTO);
    }

    /**
     * Lấy chi tiết câu hỏi theo ID (kèm danh sách answers).
     */
    public QuestionResponseDTO getQuestionById(Integer id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tìm thấy với id: " + id));
        return toResponseDTO(question);
    }

    /**
     * Tạo câu hỏi mới kèm đáp án.
     * Validate: ≥ 2 đáp án, ít nhất 1 đáp án đúng, chapter phải thuộc subject.
     * Hỗ trợ upload ảnh tùy chọn cho câu hỏi và từng đáp án.
     *
     * @param request        Dữ liệu text (content, subjectId, chapterId, answers)
     * @param questionImage  Ảnh minh họa cho câu hỏi (optional, có thể null)
     * @param answerImages   Danh sách ảnh minh họa cho đáp án (optional, có thể null)
     *                       Thứ tự ảnh tương ứng với thứ tự answers trong request.
     *                       Nếu đáp án thứ i không có ảnh, gửi file rỗng hoặc bỏ qua.
     */
    @Transactional
    public QuestionResponseDTO createQuestion(QuestionRequestDTO request,
                                               MultipartFile questionImage,
                                               List<MultipartFile> answerImages) {
        // Validate subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        // Validate chapter
        Chapter chapter = chapterRepository.findById(request.getChapterId())
                .orElseThrow(() -> new ResourceNotFoundException("Chương không tìm thấy với id: " + request.getChapterId()));

        // Validate chapter thuộc subject
        if (!chapter.getSubject().getId().equals(request.getSubjectId())) {
            throw new BadRequestException("Chương '" + chapter.getName() + "' không thuộc môn học này.");
        }

        // Validate answers
        validateAnswers(request.getAnswers());

        // Upload ảnh câu hỏi (nếu có)
        String questionImageUrl = fileUploadUtils.uploadImage(questionImage, "questions");

        // Tạo Question
        Question question = Question.builder()
                .content(request.getContent())
                .imageUrl(questionImageUrl)
                .subject(subject)
                .chapter(chapter)
                .answers(new ArrayList<>())
                .build();

        // Tạo Answers và liên kết với Question
        List<QuestionRequestDTO.AnswerDTO> answerDTOs = request.getAnswers();
        for (int i = 0; i < answerDTOs.size(); i++) {
            QuestionRequestDTO.AnswerDTO dto = answerDTOs.get(i);

            // Upload ảnh đáp án (nếu có)
            String answerImageUrl = null;
            if (answerImages != null && i < answerImages.size()) {
                MultipartFile answerFile = answerImages.get(i);
                if (answerFile != null && !answerFile.isEmpty()) {
                    answerImageUrl = fileUploadUtils.uploadImage(answerFile, "answers");
                }
            }

            Answer answer = Answer.builder()
                    .content(dto.getContent())
                    .imageUrl(answerImageUrl)
                    .isCorrect(dto.getIsCorrect() != null && dto.getIsCorrect())
                    .question(question)
                    .build();

            question.getAnswers().add(answer);
        }

        Question saved = questionRepository.save(question);
        return toResponseDTO(saved);
    }

    /**
     * Cập nhật câu hỏi + đáp án.
     * Xoá đáp án cũ, thay bằng đáp án mới (orphanRemoval).
     * Hỗ trợ upload ảnh mới hoặc giữ nguyên ảnh cũ.
     *
     * @param id             ID câu hỏi cần cập nhật
     * @param request        Dữ liệu text mới
     * @param questionImage  Ảnh minh họa mới (null = giữ ảnh cũ)
     * @param answerImages   Danh sách ảnh mới cho đáp án (null = không có ảnh nào)
     */
    @Transactional
    public QuestionResponseDTO updateQuestion(Integer id,
                                               QuestionRequestDTO request,
                                               MultipartFile questionImage,
                                               List<MultipartFile> answerImages) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tìm thấy với id: " + id));

        // Validate subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Môn học không tìm thấy với id: " + request.getSubjectId()));

        // Validate chapter
        Chapter chapter = chapterRepository.findById(request.getChapterId())
                .orElseThrow(() -> new ResourceNotFoundException("Chương không tìm thấy với id: " + request.getChapterId()));

        if (!chapter.getSubject().getId().equals(request.getSubjectId())) {
            throw new BadRequestException("Chương '" + chapter.getName() + "' không thuộc môn học này.");
        }

        // Validate answers
        validateAnswers(request.getAnswers());

        // Cập nhật ảnh câu hỏi:
        // - Có file mới => thay ảnh cũ
        // - Đánh dấu removed => xoá ảnh cũ
        // - Không có gì => giữ nguyên
        if (questionImage != null && !questionImage.isEmpty()) {
            fileUploadUtils.deleteImage(question.getImageUrl());
            question.setImageUrl(fileUploadUtils.uploadImage(questionImage, "questions"));
        } else if (Boolean.TRUE.equals(request.getQuestionImageRemoved())) {
            fileUploadUtils.deleteImage(question.getImageUrl());
            question.setImageUrl(null);
        }

        // Cập nhật Question
        question.setContent(request.getContent());
        question.setSubject(subject);
        question.setChapter(chapter);

        List<Answer> oldAnswers = new ArrayList<>(question.getAnswers());
        List<QuestionRequestDTO.AnswerDTO> answerDTOs = request.getAnswers();

        // Nếu không có file ảnh mới cho một đáp án, giữ lại ảnh cũ theo đúng vị trí.
        // Chỉ xoá ảnh cũ khi đã upload ảnh mới thay thế.
        question.getAnswers().clear();

        for (int i = 0; i < answerDTOs.size(); i++) {
            QuestionRequestDTO.AnswerDTO dto = answerDTOs.get(i);

            Answer oldAnswer = i < oldAnswers.size() ? oldAnswers.get(i) : null;
            String answerImageUrl = oldAnswer != null ? oldAnswer.getImageUrl() : null;
            Boolean answerImageRemoved = dto.getImageRemoved();

            if (answerImages != null && i < answerImages.size()) {
                MultipartFile answerFile = answerImages.get(i);
                if (answerFile != null && !answerFile.isEmpty()) {
                    fileUploadUtils.deleteImage(answerImageUrl);
                    answerImageUrl = fileUploadUtils.uploadImage(answerFile, "answers");
                } else if (Boolean.TRUE.equals(answerImageRemoved)) {
                    fileUploadUtils.deleteImage(answerImageUrl);
                    answerImageUrl = null;
                }
            } else if (Boolean.TRUE.equals(answerImageRemoved)) {
                fileUploadUtils.deleteImage(answerImageUrl);
                answerImageUrl = null;
            }

            Answer answer = Answer.builder()
                    .content(dto.getContent())
                    .imageUrl(answerImageUrl)
                    .isCorrect(dto.getIsCorrect() != null && dto.getIsCorrect())
                    .question(question)
                    .build();

            question.getAnswers().add(answer);
        }

        // Nếu số đáp án giảm đi, xoá ảnh của các đáp án bị loại bỏ
        for (int i = answerDTOs.size(); i < oldAnswers.size(); i++) {
            fileUploadUtils.deleteImage(oldAnswers.get(i).getImageUrl());
        }

        Question updated = questionRepository.save(question);
        return toResponseDTO(updated);
    }

    /**
     * Xoá câu hỏi — soft delete (nhờ @SQLDelete).
     */
    @Transactional
    public void deleteQuestion(Integer id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Câu hỏi không tìm thấy với id: " + id));
        questionRepository.delete(question);
    }

    // ==================== Validation ====================

    /**
     * Validate danh sách đáp án:
     * - Ít nhất 2 đáp án
     * - Ít nhất 1 đáp án đúng (cho phép nhiều đáp án đúng)
     */
    private void validateAnswers(List<QuestionRequestDTO.AnswerDTO> answers) {
        if (answers == null || answers.size() < 2) {
            throw new BadRequestException("Câu hỏi phải có ít nhất 2 đáp án.");
        }

        long correctCount = answers.stream()
                .filter(a -> a.getIsCorrect() != null && a.getIsCorrect())
                .count();

        if (correctCount < 1) {
            throw new BadRequestException("Câu hỏi phải có ít nhất 1 đáp án đúng.");
        }
    }

    private Page<Question> findQuestionsByFilters(
            Integer subjectId,
            Integer chapterId,
            String keyword,
            Pageable pageable
    ) {
        String normalizedKeyword = keyword != null ? keyword.trim() : null;
        boolean hasKeyword = normalizedKeyword != null && !normalizedKeyword.isBlank();

        if (subjectId != null && chapterId != null && hasKeyword) {
            return questionRepository.findBySubjectIdAndChapterIdAndContentContainingIgnoreCase(
                    subjectId,
                    chapterId,
                    normalizedKeyword,
                    pageable
            );
        }

        if (subjectId != null && chapterId != null) {
            return questionRepository.findBySubjectIdAndChapterId(subjectId, chapterId, pageable);
        }

        if (subjectId != null && hasKeyword) {
            return questionRepository.findBySubjectIdAndContentContainingIgnoreCase(subjectId, normalizedKeyword, pageable);
        }

        if (chapterId != null && hasKeyword) {
            return questionRepository.findByChapterIdAndContentContainingIgnoreCase(chapterId, normalizedKeyword, pageable);
        }

        if (subjectId != null) {
            return questionRepository.findBySubjectId(subjectId, pageable);
        }

        if (chapterId != null) {
            return questionRepository.findByChapterId(chapterId, pageable);
        }

        if (hasKeyword) {
            return questionRepository.findByContentContainingIgnoreCase(normalizedKeyword, pageable);
        }

        return questionRepository.findAll(pageable);
    }

    // ==================== Helper ====================

    private QuestionResponseDTO toResponseDTO(Question question) {
        List<QuestionResponseDTO.AnswerResponseDTO> answerDTOs = question.getAnswers() != null
                ? question.getAnswers().stream()
                    .map(a -> QuestionResponseDTO.AnswerResponseDTO.builder()
                            .id(a.getId())
                            .content(a.getContent())
                            .imageUrl(a.getImageUrl())
                            .isCorrect(a.getIsCorrect())
                            .build())
                    .collect(Collectors.toList())
                : List.of();

        return QuestionResponseDTO.builder()
                .id(question.getId())
                .content(question.getContent())
                .imageUrl(question.getImageUrl())
                .subjectId(question.getSubject().getId())
                .subjectName(question.getSubject().getName())
                .chapterId(question.getChapter().getId())
                .chapterName(question.getChapter().getName())
                .createdAt(question.getCreatedAt())
                .answers(answerDTOs)
                .build();
    }
}
