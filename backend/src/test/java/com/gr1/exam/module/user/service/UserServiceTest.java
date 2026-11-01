package com.gr1.exam.module.user.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.core.exception.UnauthorizedException;
import com.gr1.exam.core.security.JwtTokenProvider;
import com.gr1.exam.module.user.dto.CreateStudentRequestDTO;
import com.gr1.exam.module.user.dto.CreateStudentResponseDTO;
import com.gr1.exam.module.user.dto.CreateTeacherRequestDTO;
import com.gr1.exam.module.user.dto.LoginRequestDTO;
import com.gr1.exam.module.user.dto.LoginResponseDTO;
import com.gr1.exam.module.user.dto.UpdateProfileRequestDTO;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private UserService userService;

    @Test
    void login_shouldReturnBearerTokenAndUser_whenCredentialsValid() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setUsername("alice");
        request.setPassword("pass");

        User user = User.builder()
                .id(7)
                .username("alice")
                .name("Alice")
                .password("encoded")
                .role(User.Role.ADMIN)
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("alice", null, List.of()));
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken("alice")).thenReturn("jwt-token");

        LoginResponseDTO result = userService.login(request);

        assertThat(result.getToken()).isEqualTo("jwt-token");
        assertThat(result.getTokenType()).isEqualTo("Bearer");
        assertThat(result.getUser().getId()).isEqualTo(7);
        assertThat(result.getUser().getRole()).isEqualTo("ADMIN");
    }

    @Test
    void login_shouldThrowUnauthorized_whenBadCredentials() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setUsername("alice");
        request.setPassword("wrong");

        doThrow(new BadCredentialsException("bad creds"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Sai tên đăng nhập hoặc mật khẩu");

        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void login_shouldThrowUnauthorized_whenUserNotFoundAfterAuthentication() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setUsername("ghost");
        request.setPassword("pass");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("ghost", null, List.of()));
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("User không tồn tại");

        verify(jwtTokenProvider, never()).generateToken(anyString());
    }

    @Test
    void createTeacher_shouldCreateTeacher_whenRequestValid() {
        CreateTeacherRequestDTO request = new CreateTeacherRequestDTO();
        request.setUsername("teacher01");
        request.setPassword("plain-pass");
        request.setName("Teacher One");

        when(userRepository.existsByUsername("teacher01")).thenReturn(false);
        when(passwordEncoder.encode("plain-pass")).thenReturn("encoded-pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(11);
            return saved;
        });

        UserResponseDTO response = userService.createTeacher(request);

        assertThat(response.getId()).isEqualTo(11);
        assertThat(response.getUsername()).isEqualTo("teacher01");
        assertThat(response.getRole()).isEqualTo("TEACHER");
    }

    @Test
    void createTeacher_shouldThrowBadRequest_whenUsernameExists() {
        CreateTeacherRequestDTO request = new CreateTeacherRequestDTO();
        request.setUsername("existing");
        request.setPassword("pass");
        request.setName("Teacher");

        when(userRepository.existsByUsername("existing")).thenReturn(true);

        assertThatThrownBy(() -> userService.createTeacher(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Username đã tồn tại");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createStudent_shouldThrowBadRequest_whenStudentIdExists() {
        CreateStudentRequestDTO request = new CreateStudentRequestDTO();
        request.setStudentId("SE123456");
        request.setName("Student A");

        when(userRepository.existsByStudentId("SE123456")).thenReturn(true);

        assertThatThrownBy(() -> userService.createStudent(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("MSSV đã tồn tại");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createStudent_shouldThrowBadRequest_whenCannotGenerateUniqueUsername() {
        CreateStudentRequestDTO request = new CreateStudentRequestDTO();
        request.setStudentId("SE123457");
        request.setName("Student B");

        when(userRepository.existsByStudentId("SE123457")).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        assertThatThrownBy(() -> userService.createStudent(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Không thể sinh username ngẫu nhiên duy nhất");

        verify(userRepository, times(10)).existsByUsername(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createStudent_shouldReturnCredentials_whenRequestValid() {
        CreateStudentRequestDTO request = new CreateStudentRequestDTO();
        request.setStudentId("SE123458");
        request.setName("Student C");

        when(userRepository.existsByStudentId("SE123458")).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(20);
            return saved;
        });

        CreateStudentResponseDTO response = userService.createStudent(request);

        assertThat(response.getId()).isEqualTo(20);
        assertThat(response.getStudentId()).isEqualTo("SE123458");
        assertThat(response.getRole()).isEqualTo("STUDENT");
        assertThat(response.getUsername()).isNotBlank();
        assertThat(response.getPassword()).isNotBlank();
    }

    @Test
    void getAllUsers_shouldReturnAll_whenCallerIsAdmin() {
        User admin = User.builder().username("admin").role(User.Role.ADMIN).build();
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findAll()).thenReturn(List.of(
                User.builder().id(1).username("admin").role(User.Role.ADMIN).name("Admin").build(),
                User.builder().id(2).username("teacher").role(User.Role.TEACHER).name("Teacher").build()
        ));

        List<UserResponseDTO> result = userService.getAllUsers("admin");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getUsername()).isEqualTo("admin");
    }

    @Test
    void getAllUsers_shouldReturnStudentsOnly_whenCallerIsTeacher() {
        User teacher = User.builder().username("teacher").role(User.Role.TEACHER).build();
        when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(teacher));
        when(userRepository.findByRole(User.Role.STUDENT)).thenReturn(List.of(
                User.builder().id(3).username("std1").role(User.Role.STUDENT).name("Student").build()
        ));

        List<UserResponseDTO> result = userService.getAllUsers("teacher");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRole()).isEqualTo("STUDENT");
    }

    @Test
    void getUserById_shouldThrowUnauthorized_whenTeacherReadsNonStudent() {
        User teacher = User.builder().username("teacher").role(User.Role.TEACHER).build();
        User adminTarget = User.builder().id(1).username("admin").role(User.Role.ADMIN).build();

        when(userRepository.findByUsername("teacher")).thenReturn(Optional.of(teacher));
        when(userRepository.findById(1)).thenReturn(Optional.of(adminTarget));

        assertThatThrownBy(() -> userService.getUserById(1, "teacher"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("TEACHER chỉ có quyền xem thông tin STUDENT");
    }

    @Test
    void updateUser_shouldUpdateTeacherData_whenValidRequest() {
        User existing = User.builder()
                .id(3)
                .username("old-teacher")
                .name("Old Name")
                .password("old-pass")
                .role(User.Role.TEACHER)
                .build();

        CreateTeacherRequestDTO request = new CreateTeacherRequestDTO();
        request.setUsername("new-teacher");
        request.setName("New Name");
        request.setPassword("new-pass");

        when(userRepository.findById(3)).thenReturn(Optional.of(existing));
        when(userRepository.existsByUsername("new-teacher")).thenReturn(false);
        when(passwordEncoder.encode("new-pass")).thenReturn("encoded-new-pass");
        when(userRepository.save(existing)).thenReturn(existing);

        UserResponseDTO result = userService.updateUser(3, request);

        assertThat(result.getUsername()).isEqualTo("new-teacher");
        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(existing.getPassword()).isEqualTo("encoded-new-pass");
    }

    @Test
    void updateMyProfile_shouldThrowUnauthorized_whenCallerIsNotTeacher() {
        User admin = User.builder().username("admin").role(User.Role.ADMIN).build();
        UpdateProfileRequestDTO request = new UpdateProfileRequestDTO();
        request.setName("Updated");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> userService.updateMyProfile(request, "admin"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Chỉ TEACHER có thể sử dụng chức năng này");
    }

    @Test
    void deleteUser_shouldThrowNotFound_whenMissing() {
        when(userRepository.findById(123)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(123))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User không tìm thấy với id: 123");
    }
}