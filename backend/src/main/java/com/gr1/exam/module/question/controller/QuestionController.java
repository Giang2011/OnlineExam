package com.gr1.exam.module.question.controller;

import com.gr1.exam.module.question.dto.QuestionRequestDTO;
import com.gr1.exam.module.question.dto.QuestionResponseDTO;
import com.gr1.exam.module.question.service.QuestionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.List;
import java.util.Set;

/**
 * REST Controller cho Câu hỏi.
 * Endpoints: /questions/**
 * (Prefix /api/v1 được thêm bởi context-path)
 *
 * Tạo/Cập nhật câu hỏi sử dụng multipart/form-data:
 * - Part "data": JSON string chứa QuestionRequestDTO
 * - Part "questionImage": (optional) File ảnh minh họa cho câu hỏi
 * - Part "answerImages": (optional) List file ảnh minh họa cho các đáp án (theo thứ tự)
 */
@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    /**
     * GET /api/v1/questions — Danh sách câu hỏi (filter + phân trang).
     * Query params: subjectId, chapterId, keyword, page (default 0), size (default 20)
     */
    @GetMapping
    public ResponseEntity<Page<QuestionResponseDTO>> getAllQuestions(
            @RequestParam(required = false) Integer subjectId,
            @RequestParam(required = false) Integer chapterId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(questionService.getAllQuestions(subjectId, chapterId, keyword, pageable));
    }

    /**
     * GET /api/v1/questions/{id} — Chi tiết câu hỏi + answers.
     */
    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponseDTO> getQuestionById(@PathVariable Integer id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    /**
     * POST /api/v1/questions — Tạo câu hỏi + đáp án (ADMIN, TEACHER).
     *
     * Content-Type: multipart/form-data
     * Parts:
     *   - "data" (required): JSON string chứa QuestionRequestDTO
     *   - "questionImage" (optional): File ảnh minh họa cho câu hỏi
     *   - "answerImages" (optional): Danh sách file ảnh cho các đáp án (theo thứ tự index)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuestionResponseDTO> createQuestion(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "questionImage", required = false) MultipartFile questionImage,
            @RequestPart(value = "answerImages", required = false) List<MultipartFile> answerImages) {

        QuestionRequestDTO request = parseAndValidate(dataJson);
        QuestionResponseDTO response = questionService.createQuestion(request, questionImage, answerImages);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * PUT /api/v1/questions/{id} — Cập nhật câu hỏi + đáp án (ADMIN, TEACHER).
     *
     * Content-Type: multipart/form-data
     * Parts:
     *   - "data" (required): JSON string chứa QuestionRequestDTO
     *   - "questionImage" (optional): File ảnh mới cho câu hỏi (null = giữ ảnh cũ)
     *   - "answerImages" (optional): Danh sách file ảnh mới cho đáp án (null = giữ ảnh cũ)
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<QuestionResponseDTO> updateQuestion(
            @PathVariable Integer id,
            @RequestPart("data") String dataJson,
            @RequestPart(value = "questionImage", required = false) MultipartFile questionImage,
            @RequestPart(value = "answerImages", required = false) List<MultipartFile> answerImages) {

        QuestionRequestDTO request = parseAndValidate(dataJson);
        return ResponseEntity.ok(questionService.updateQuestion(id, request, questionImage, answerImages));
    }

    /**
     * DELETE /api/v1/questions/{id} — Xoá câu hỏi (ADMIN, TEACHER).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Integer id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== Helper ====================

    /**
     * Parse JSON string thành QuestionRequestDTO và validate.
     * Vì dữ liệu đến dưới dạng String (part trong multipart), cần parse thủ công.
     */
    private QuestionRequestDTO parseAndValidate(String dataJson) {
        QuestionRequestDTO request;
        try {
            request = objectMapper.readValue(dataJson, QuestionRequestDTO.class);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Dữ liệu JSON không hợp lệ: " + e.getMessage());
        }

        // Validate thủ công (vì không dùng @Valid @RequestBody)
        Set<ConstraintViolation<QuestionRequestDTO>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            String message = violations.iterator().next().getMessage();
            throw new BadRequestException(message);
        }

        return request;
    }
}
