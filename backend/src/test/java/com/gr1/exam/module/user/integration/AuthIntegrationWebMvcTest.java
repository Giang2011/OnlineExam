package com.gr1.exam.module.user.integration;

import com.gr1.exam.core.security.JwtAuthenticationFilter;
import com.gr1.exam.module.user.controller.UserController;
import com.gr1.exam.module.user.dto.CreateStudentResponseDTO;
import com.gr1.exam.module.user.dto.LoginResponseDTO;
import com.gr1.exam.module.user.dto.UserResponseDTO;
import com.gr1.exam.module.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthIntegrationWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void login_shouldReturn200_withJwtPayload() throws Exception {
        LoginResponseDTO response = LoginResponseDTO.builder()
                .token("jwt-token")
                .tokenType("Bearer")
                .user(UserResponseDTO.builder().id(1).username("admin").name("Admin").role("ADMIN").build())
                .build();

        when(userService.login(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.username").value("admin"))
                .andExpect(jsonPath("$.user.role").value("ADMIN"));
    }

    @Test
    void login_shouldReturn400_whenRequestValidationFails() throws Exception {
        String invalidRequest = "{\"username\":\"\",\"password\":\"\"}";

        mockMvc.perform(post("/api/v1/auth/login")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createStudent_shouldReturn201_withExpectedBody() throws Exception {
        CreateStudentResponseDTO response = CreateStudentResponseDTO.builder()
                .id(10)
                .studentId("SE150010")
                .name("New Student")
                .username("st123456")
                .password("pw123456")
                .role("STUDENT")
                .build();

        when(userService.createStudent(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/users/students")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":\"SE150010\",\"name\":\"New Student\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.studentId").value("SE150010"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }
}