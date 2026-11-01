package com.gr1.exam.module.session.controller;

import com.gr1.exam.module.session.dto.*;
import com.gr1.exam.module.session.service.ExamSessionService;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho phiên thi (thí sinh).
 *
 * <p>Mọi response đều kèm {@code serverTime} + {@code remainingSeconds} — FE chỉ hiển thị,
 * server là nguồn quyết định thời gian.
 */
@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class ExamSessionController {

    private final ExamSessionService examSessionService;
    private final UserRepository userRepository;

    /**
     * POST /api/v1/sessions/start/{examId} — Bắt đầu (hoặc resume) phiên thi.
     */
    @PostMapping("/start/{examId}")
    public ResponseEntity<ExamSessionResponseDTO> startSession(@PathVariable Integer examId) {
        Integer userId = getCurrentUserId();
        ExamSessionResponseDTO response = examSessionService.startSession(examId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/sessions/active — Phiên DOING hiện tại (khôi phục sau khi đóng trình duyệt).
     * Trả 204 nếu không có phiên nào đang diễn ra.
     */
    @GetMapping("/active")
    public ResponseEntity<ActiveSessionResponseDTO> getActiveSession() {
        ActiveSessionResponseDTO response = examSessionService.getActiveSession(getCurrentUserId());
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/sessions/{id} — Chi tiết phiên thi (deadline, lượt thi, thời gian còn lại).
     */
    @GetMapping("/{id}")
    public ResponseEntity<SessionDetailResponseDTO> getSession(@PathVariable Integer id) {
        return ResponseEntity.ok(examSessionService.getSessionDetail(id, getCurrentUserId()));
    }

    /**
     * GET /api/v1/sessions/{id}/questions — Lấy đề thi đã gán (variant).
     */
    @GetMapping("/{id}/questions")
    public ResponseEntity<List<ExamQuestionResponseDTO>> getQuestions(@PathVariable Integer id) {
        Integer userId = getCurrentUserId();
        List<ExamQuestionResponseDTO> questions = examSessionService.getQuestions(id, userId);
        return ResponseEntity.ok(questions);
    }

    /**
     * GET /api/v1/sessions/{id}/answers — Lấy đáp án draft đã autosave.
     */
    @GetMapping("/{id}/answers")
    public ResponseEntity<SessionAnswersResponseDTO> getAnswers(@PathVariable Integer id) {
        return ResponseEntity.ok(examSessionService.getAnswers(id, getCurrentUserId()));
    }

    /**
     * PUT /api/v1/sessions/{id}/answers — Autosave đáp án (không chấm điểm, không đổi trạng thái).
     */
    @PutMapping("/{id}/answers")
    public ResponseEntity<SessionAnswersResponseDTO> saveAnswers(@PathVariable Integer id,
            @Valid @RequestBody SaveAnswersRequestDTO dto) {
        return ResponseEntity.ok(examSessionService.saveAnswers(id, getCurrentUserId(), dto));
    }

    /**
     * POST /api/v1/sessions/{id}/submit — Nộp bài thi.
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ExamSessionResponseDTO> submitSession(@PathVariable Integer id,
            @Valid @RequestBody SubmitSessionRequestDTO dto) {
        Integer userId = getCurrentUserId();
        ExamSessionResponseDTO response = examSessionService.submitSession(id, userId, dto);
        return ResponseEntity.ok(response);
    }

    // ==================== Helper ====================

    /**
     * Lấy ID user hiện tại từ SecurityContext (by username).
     */
    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user: " + username));
        return user.getId();
    }
}
