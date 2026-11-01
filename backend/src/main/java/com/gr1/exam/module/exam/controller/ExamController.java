package com.gr1.exam.module.exam.controller;

import com.gr1.exam.module.exam.dto.ExamParticipantDTO;
import com.gr1.exam.module.exam.dto.ExamRequestDTO;
import com.gr1.exam.module.exam.dto.ExamResponseDTO;
import com.gr1.exam.module.exam.service.ExamService;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho Kỳ thi.
 * Endpoints: /exams/**
 * (Prefix /api/v1 được thêm bởi context-path)
 */
@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    // ==================== CRUD Kỳ thi ====================

    /**
     * GET /api/v1/exams — Danh sách kỳ thi (phân quyền theo caller).
     */
    @GetMapping
    public ResponseEntity<List<ExamResponseDTO>> getAllExams() {
        return ResponseEntity.ok(examService.getAllExams(getCurrentUsername()));
    }

    /**
     * GET /api/v1/exams/{id} — Chi tiết kỳ thi (Authenticated).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ExamResponseDTO> getExamById(@PathVariable Integer id) {
        return ResponseEntity.ok(examService.getExamById(id));
    }

    /**
     * POST /api/v1/exams — Tạo kỳ thi mới (ADMIN/TEACHER).
     */
    @PostMapping
    public ResponseEntity<ExamResponseDTO> createExam(@Valid @RequestBody ExamRequestDTO request) {
        ExamResponseDTO response = examService.createExam(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * PUT /api/v1/exams/{id} — Cập nhật kỳ thi (ADMIN/TEACHER).
     */
    @PutMapping("/{id}")
    public ResponseEntity<ExamResponseDTO> updateExam(@PathVariable Integer id,
                                                       @Valid @RequestBody ExamRequestDTO request) {
        return ResponseEntity.ok(examService.updateExam(id, request));
    }

    /**
     * DELETE /api/v1/exams/{id} — Xoá kỳ thi (ADMIN/TEACHER).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExam(@PathVariable Integer id) {
        examService.deleteExam(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== Quản lý Thí sinh ====================

    /**
     * POST /api/v1/exams/{id}/participants — Thêm thí sinh (ADMIN/TEACHER).
     */
    @PostMapping("/{id}/participants")
    public ResponseEntity<Void> addParticipant(@PathVariable Integer id,
                                                @Valid @RequestBody ExamParticipantDTO request) {
        examService.addParticipant(id, request);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    /**
     * DELETE /api/v1/exams/{examId}/participants/{userId} — Xoá thí sinh (ADMIN/TEACHER).
     */
    @DeleteMapping("/{examId}/participants/{userId}")
    public ResponseEntity<Void> removeParticipant(@PathVariable Integer examId, @PathVariable Integer userId) {
        examService.removeParticipant(examId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/exams/{id}/participants — Danh sách thí sinh (ADMIN/TEACHER).
     */
    @GetMapping("/{id}/participants")
    public ResponseEntity<List<UserResponseDTO>> getParticipants(@PathVariable Integer id) {
        return ResponseEntity.ok(examService.getParticipants(id));
    }

    // ==================== Helper ====================

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
