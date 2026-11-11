package com.gr1.exam.module.grading.controller;

import com.gr1.exam.core.exception.ForbiddenException;
import com.gr1.exam.core.exception.UnauthorizedException;
import com.gr1.exam.module.grading.dto.ExamResultsResponseDTO;
import com.gr1.exam.module.grading.dto.ResultResponseDTO;
import com.gr1.exam.module.grading.service.GradingService;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/results")
@RequiredArgsConstructor
public class GradingController {
    private final GradingService gradingService;
    private final UserRepository userRepository;

    /**
     * Kết quả của 1 phiên thi.
     *
     * <p>Phân quyền: ADMIN/TEACHER xem được mọi phiên; STUDENT chỉ xem được phiên của
     * chính mình (tránh đoán {@code sessionId} để xem điểm của thí sinh khác).
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<ResultResponseDTO> getResultBySession(@PathVariable Integer sessionId) {
        return ResponseEntity.ok(gradingService.getResultBySession(
                sessionId, getCurrentUserId(), isAdminOrTeacher()));
    }

    @GetMapping("/exam/{examId}")
    public ResponseEntity<ExamResultsResponseDTO> getResultsByExam(@PathVariable Integer examId) {
        ensureAdminOrTeacher();
        return ResponseEntity.ok(gradingService.getResultsByExam(examId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ResultResponseDTO>> getMyResults() {
        return ResponseEntity.ok(gradingService.getMyResults(getCurrentUserId()));
    }

    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Không tìm thấy thông tin người dùng hiện tại."));
        return user.getId();
    }

    private boolean isAdminOrTeacher() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ROLE_TEACHER".equals(a));
    }

    private void ensureAdminOrTeacher() {
        if (!isAdminOrTeacher()) {
            throw new ForbiddenException("Bạn không có quyền truy cập tài nguyên này.");
        }
    }
}
