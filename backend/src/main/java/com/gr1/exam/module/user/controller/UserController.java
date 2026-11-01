package com.gr1.exam.module.user.controller;

import com.gr1.exam.module.user.dto.*;
import com.gr1.exam.module.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller cho User & Authentication.
 * Endpoints: /auth/**, /users/**
 */
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ==================== Authentication ====================

    /**
     * POST /api/v1/auth/login — Đăng nhập bằng username.
     */
    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(userService.login(request));
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
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable Integer id,
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
