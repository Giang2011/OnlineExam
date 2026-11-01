package com.gr1.exam.module.question.controller;

import com.gr1.exam.module.question.dto.ChapterRequestDTO;
import com.gr1.exam.module.question.dto.ChapterResponseDTO;
import com.gr1.exam.module.question.service.ChapterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho Chương trong môn học.
 * Endpoints: /subjects/{subjectId}/chapters
 */
@RestController
@RequestMapping("/subjects/{subjectId}/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;

    /**
     * GET /api/v1/subjects/{subjectId}/chapters — Danh sách chương.
     */
    @GetMapping
    public ResponseEntity<List<ChapterResponseDTO>> getChapters(@PathVariable Integer subjectId) {
        return ResponseEntity.ok(chapterService.getChaptersBySubject(subjectId));
    }

    /**
     * POST /api/v1/subjects/{subjectId}/chapters — Tạo chương.
     */
    @PostMapping
    public ResponseEntity<ChapterResponseDTO> createChapter(
            @PathVariable Integer subjectId,
            @Valid @RequestBody ChapterRequestDTO request) {
        return new ResponseEntity<>(chapterService.createChapter(subjectId, request), HttpStatus.CREATED);
    }

    /**
     * PUT /api/v1/subjects/{subjectId}/chapters/{id} — Cập nhật chương.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ChapterResponseDTO> updateChapter(
            @PathVariable Integer subjectId,
            @PathVariable Integer id,
            @Valid @RequestBody ChapterRequestDTO request) {
        return ResponseEntity.ok(chapterService.updateChapter(subjectId, id, request));
    }

    /**
     * DELETE /api/v1/subjects/{subjectId}/chapters/{id} — Xoá chương.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChapter(
            @PathVariable Integer subjectId,
            @PathVariable Integer id) {
        chapterService.deleteChapter(subjectId, id);
        return ResponseEntity.noContent().build();
    }
}
