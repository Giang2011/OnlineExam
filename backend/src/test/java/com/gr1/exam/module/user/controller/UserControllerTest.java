package com.gr1.exam.module.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.exception.GlobalExceptionHandler;
import com.gr1.exam.module.user.dto.CreateStudentResponseDTO;
import com.gr1.exam.module.user.dto.LoginResponseDTO;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void login_shouldReturnOk() throws Exception {
        LoginResponseDTO response = LoginResponseDTO.builder()
                .token("jwt-token")
                .tokenType("Bearer")
                .user(UserResponseDTO.builder().id(2).username("admin").name("Admin").role("ADMIN").build())
                .build();

        when(userService.login(any())).thenReturn(response);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"secret\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.username").value("admin"));
    }

    @Test
    void login_shouldReturnBadRequest_whenUsernameBlank() throws Exception {
        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"secret\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createStudent_shouldReturnCreated() throws Exception {
        CreateStudentResponseDTO response = CreateStudentResponseDTO.builder()
                .id(10)
                .studentId("SE150001")
                .name("Student One")
                .username("s123456")
                .password("p123456")
                .role("STUDENT")
                .build();

        when(userService.createStudent(any())).thenReturn(response);

        mockMvc.perform(post("/users/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":\"SE150001\",\"name\":\"Student One\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }

    @Test
    void getAllUsers_shouldReturnOkWithList() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("teacher01", null, List.of())
        );

        when(userService.getAllUsers("teacher01")).thenReturn(List.of(
                UserResponseDTO.builder().id(1).username("u1").name("User One").role("STUDENT").build(),
                UserResponseDTO.builder().id(2).username("u2").name("User Two").role("STUDENT").build()
        ));

        mockMvc.perform(get("/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("u1"))
                .andExpect(jsonPath("$[1].role").value("STUDENT"));
    }

    @Test
    void getUserById_shouldReturnOk() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin", null, List.of())
        );

        when(userService.getUserById(5, "admin")).thenReturn(
                UserResponseDTO.builder().id(5).username("john").name("John").role("STUDENT").build()
        );

        mockMvc.perform(get("/users/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.username").value("john"));
    }

    @Test
    void updateUser_shouldReturnOk() throws Exception {
        when(userService.updateUser(eq(3), any())).thenReturn(
                UserResponseDTO.builder().id(3).username("teacher03").name("Teacher 03").role("TEACHER").build()
        );

        mockMvc.perform(put("/users/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"teacher03\",\"password\":\"new-pass\",\"name\":\"Teacher 03\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.role").value("TEACHER"));
    }

    @Test
    void updateMyProfile_shouldReturnOk() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("teacher01", null, List.of())
        );

        when(userService.updateMyProfile(any(), eq("teacher01"))).thenReturn(
                UserResponseDTO.builder().id(9).username("teacher01").name("Teacher Updated").role("TEACHER").build()
        );

        mockMvc.perform(put("/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Teacher Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Teacher Updated"));
    }

    @Test
    void deleteUser_shouldReturnNoContent() throws Exception {
        doNothing().when(userService).deleteUser(4);

        mockMvc.perform(delete("/users/4"))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser(4);
    }
}