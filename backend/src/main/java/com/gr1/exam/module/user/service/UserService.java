package com.gr1.exam.module.user.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.core.exception.UnauthorizedException;
import com.gr1.exam.core.security.JwtTokenProvider;
import com.gr1.exam.core.utils.CredentialGenerator;
import com.gr1.exam.module.user.dto.*;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ User: đăng nhập, tạo student/teacher, CRUD.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private static final int MAX_USERNAME_GENERATION_ATTEMPTS = 10;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    // ==================== Authentication ====================

    /**
     * Đăng nhập — Xác thực qua AuthenticationManager, tạo JWT.
     */
    public LoginResponseDTO login(LoginRequestDTO request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new UnauthorizedException("Sai tên đăng nhập hoặc mật khẩu.");
        }

        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new UnauthorizedException("User không tồn tại."));

        String token = jwtTokenProvider.generateToken(user.getUsername());

        return LoginResponseDTO.builder()
                .token(token)
                .tokenType("Bearer")
                .user(toResponseDTO(user))
                .build();
    }

    // ==================== Tạo tài khoản ====================

    /**
     * Tạo student — Admin/Teacher nhập MSSV + tên, server random username/password.
     */
    public CreateStudentResponseDTO createStudent(CreateStudentRequestDTO request) {
        // Validate MSSV chưa tồn tại
        if (userRepository.existsByStudentId(request.getStudentId())) {
            throw new BadRequestException("MSSV đã tồn tại: " + request.getStudentId());
        }

        // Random credentials
        String randomUsername = generateUniqueRandomUsername();
        String randomPassword = CredentialGenerator.randomPassword();

        User user = User.builder()
                .username(randomUsername)
                .name(request.getName())
                .studentId(request.getStudentId())
                .password(passwordEncoder.encode(randomPassword))
                .role(User.Role.STUDENT)
                .build();

        User saved = userRepository.save(user);

        // Trả về credentials 1 lần duy nhất (plain text password)
        return CreateStudentResponseDTO.builder()
                .id(saved.getId())
                .studentId(saved.getStudentId())
                .name(saved.getName())
                .username(randomUsername)
                .password(randomPassword)  // Plain text — chỉ trả 1 lần
                .role("STUDENT")
                .build();
    }

    /**
     * Tạo teacher — Chỉ Admin, nhập username + password + tên.
     */
    public UserResponseDTO createTeacher(CreateTeacherRequestDTO request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username đã tồn tại: " + request.getUsername());
        }

        User user = User.builder()
                .username(request.getUsername())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.TEACHER)
                .build();

        User saved = userRepository.save(user);
        return toResponseDTO(saved);
    }

    // ==================== CRUD ====================

    /**
     * Lấy danh sách users — phân quyền theo role caller.
     * Admin: xem tất cả. Teacher: chỉ xem STUDENT.
     */
    public List<UserResponseDTO> getAllUsers(String callerUsername) {
        User caller = findByUsernameOrThrow(callerUsername);

        List<User> users;
        if (caller.getRole() == User.Role.ADMIN) {
            users = userRepository.findAll();
        } else {
            // TEACHER chỉ xem STUDENT
            users = userRepository.findByRole(User.Role.STUDENT);
        }

        return users.stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    /**
     * Lấy user theo ID — Teacher chỉ xem STUDENT.
     */
    public UserResponseDTO getUserById(Integer id, String callerUsername) {
        User caller = findByUsernameOrThrow(callerUsername);
        User target = findByIdOrThrow(id);

        // Teacher chỉ xem STUDENT
        if (caller.getRole() == User.Role.TEACHER && target.getRole() != User.Role.STUDENT) {
            throw new UnauthorizedException("TEACHER chỉ có quyền xem thông tin STUDENT.");
        }

        return toResponseDTO(target);
    }

    /**
     * Cập nhật thông tin user — Chỉ áp dụng cho tài khoản TEACHER.
     */
    public UserResponseDTO updateUser(Integer id, CreateTeacherRequestDTO request) {
        User user = findByIdOrThrow(id);

        if (user.getRole() != User.Role.TEACHER) {
            throw new BadRequestException("Chỉ được sửa tài khoản có role TEACHER.");
        }

        // Cập nhật username (kiểm tra trùng nếu đổi)
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            if (!user.getUsername().equals(request.getUsername()) && userRepository.existsByUsername(request.getUsername())) {
                throw new BadRequestException("Username đã tồn tại: " + request.getUsername());
            }
            user.setUsername(request.getUsername());
        }

        // Cập nhật name
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }

        // Cập nhật password nếu có
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        return toResponseDTO(updatedUser);
    }

    /**
     * Teacher tự cập nhật thông tin — PUT /users/me
     */
    public UserResponseDTO updateMyProfile(UpdateProfileRequestDTO request, String currentUsername) {
        User user = findByUsernameOrThrow(currentUsername);

        // CHỈ TEACHER mới được dùng endpoint này
        if (user.getRole() != User.Role.TEACHER) {
            throw new UnauthorizedException("Chỉ TEACHER có thể sử dụng chức năng này.");
        }

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            if (!user.getUsername().equals(request.getUsername())
                && userRepository.existsByUsername(request.getUsername())) {
                throw new BadRequestException("Username đã tồn tại.");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }

        User updated = userRepository.save(user);
        return toResponseDTO(updated);
    }

    /**
     * Xoá user theo ID — Soft delete (tự động bởi @SQLDelete).
     */
    public void deleteUser(Integer id) {
        User user = findByIdOrThrow(id);
        userRepository.delete(user);
    }

    // ==================== Helper ====================

    private String generateUniqueRandomUsername() {
        for (int i = 0; i < MAX_USERNAME_GENERATION_ATTEMPTS; i++) {
            String candidate = CredentialGenerator.randomUsername();
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }
        throw new BadRequestException("Không thể sinh username ngẫu nhiên duy nhất. Vui lòng thử lại.");
    }

    private User findByUsernameOrThrow(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Không xác thực được người dùng hiện tại."));
    }

    private User findByIdOrThrow(Integer id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User không tìm thấy với id: " + id));
    }

    private UserResponseDTO toResponseDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .studentId(user.getStudentId())
                .role(user.getRole().name())
                .build();
    }
}
