package com.gr1.exam.module.user.controller;

import com.gr1.exam.module.user.dto.*;
import com.gr1.exam.module.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho User & Authentication.
 * Endpoints: /auth/**, /users/**
 *
 * <p>Xác thực bằng cookie phiên {@code EXAMSESSION} (HttpOnly) — không dùng JWT.
 */
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SecurityContextRepository securityContextRepository;

    // ==================== Authentication ====================

    /**
     * POST /api/v1/auth/login — Đăng nhập bằng username.
     *
     * <p>Trả cookie phiên (HttpOnly). Không cần giữ token ở client.
     */
    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request,
                                                   HttpServletRequest httpRequest,
                                                   HttpServletResponse httpResponse) {
        LoginResponseDTO response = userService.login(request);

        // Spring Security 6 (requireExplicitSave=true): phải persist SecurityContext
        // vào HttpSession một cách tường minh, nếu không session sẽ không lưu auth.
        SecurityContext context = SecurityContextHolder.getContext();
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        // Chống session fixation: đổi session id sau khi đã xác thực.
        // Attributes (kể cả SecurityContext vừa lưu) được giữ nguyên.
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            httpRequest.changeSessionId();
        }

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/logout — Đăng xuất, vô hiệu hoá phiên hiện tại.
     */
    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        userService.logout(request.getSession(false));
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/auth/me — Thông tin user hiện tại (khởi phục trạng thái sau reload).
     */
    @GetMapping("/auth/me")
    public ResponseEntity<UserResponseDTO> me() {
        return ResponseEntity.ok(userService.getCurrentUser(getCurrentUsername()));
    }

    // ==================== Tạo tài khoản ====================

    /**
     * POST /api/v1/users/students — Tạo student (ADMIN/TEACHER).
     */
    @PostMapping("/users/students")
    public ResponseEntity<CreateStudentResponseDTO> createStudent(
            @Valid @RequestBody CreateStudentRequestDTO request) {
        return new ResponseEntity<>(userService.createStudent(request), HttpStatus.CREATED);
    }

    /**
     * POST /api/v1/users/teachers — Tạo teacher (ADMIN only).
     */
    @PostMapping("/users/teachers")
    public ResponseEntity<UserResponseDTO> createTeacher(
            @Valid @RequestBody CreateTeacherRequestDTO request) {
        return new ResponseEntity<>(userService.createTeacher(request), HttpStatus.CREATED);
    }

    // ==================== CRUD ====================

    /**
     * GET /api/v1/users — Danh sách users (ADMIN/TEACHER).
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers(getCurrentUsername()));
    }

    /**
     * GET /api/v1/users/{id} — Chi tiết user (ADMIN/TEACHER).
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUserById(id, getCurrentUsername()));
    }

    /**
     * PUT /api/v1/users/me — Teacher tự cập nhật profile.
     */
    @PutMapping("/users/me")
    public ResponseEntity<UserResponseDTO> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequestDTO request) {
        return ResponseEntity.ok(userService.updateMyProfile(request, getCurrentUsername()));
    }

    /**
     * PUT /api/v1/users/{id} — Admin sửa user.
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Integer id,
            @Valid @RequestBody CreateTeacherRequestDTO request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    /**
     * DELETE /api/v1/users/{id} — Admin xoá user (soft delete).
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== Helper ====================

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
