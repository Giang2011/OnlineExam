package com.gr1.exam.module.question.controller;

import com.gr1.exam.module.question.dto.SubjectRequestDTO;
import com.gr1.exam.module.question.dto.SubjectResponseDTO;
import com.gr1.exam.module.question.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho Môn học.
 * Endpoints: /subjects/**
 * (Prefix /api/v1 được thêm bởi context-path)
 */
@RestController
@RequestMapping("/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    /**
     * GET /api/v1/subjects — Danh sách tất cả môn học (Public).
     */
    @GetMapping
    public ResponseEntity<List<SubjectResponseDTO>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    /**
     * POST /api/v1/subjects — Tạo môn học mới (ADMIN).
     */
    @PostMapping
    public ResponseEntity<SubjectResponseDTO> createSubject(@Valid @RequestBody SubjectRequestDTO request) {
        SubjectResponseDTO response = subjectService.createSubject(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * PUT /api/v1/subjects/{id} — Cập nhật tên môn học (ADMIN).
     */
    @PutMapping("/{id}")
    public ResponseEntity<SubjectResponseDTO> updateSubject(@PathVariable Integer id,
                                                             @Valid @RequestBody SubjectRequestDTO request) {
        return ResponseEntity.ok(subjectService.updateSubject(id, request));
    }

    /**
     * DELETE /api/v1/subjects/{id} — Xoá môn học (ADMIN).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Integer id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.noContent().build();
    }
}
