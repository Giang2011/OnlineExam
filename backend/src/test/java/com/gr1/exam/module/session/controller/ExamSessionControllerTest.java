package com.gr1.exam.module.session.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.exception.GlobalExceptionHandler;
import com.gr1.exam.module.session.dto.ExamQuestionResponseDTO;
import com.gr1.exam.module.session.dto.ExamSessionResponseDTO;
import com.gr1.exam.module.session.service.ExamSessionService;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ExamSessionControllerTest {

    @Mock
    private ExamSessionService examSessionService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ExamSessionController examSessionController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(examSessionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void startSession_shouldReturnOk() throws Exception {
        setAuthenticatedUser("student01", 10);

        ExamSessionResponseDTO response = ExamSessionResponseDTO.builder()
                .id(100)
                .examId(1)
                .examTitle("Midterm")
                .userId(10)
                .userName("Student 01")
                .status("DOING")
                .build();

        when(examSessionService.startSession(1, 10)).thenReturn(response);

        mockMvc.perform(post("/sessions/start/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.examId").value(1))
                .andExpect(jsonPath("$.status").value("DOING"));

        verify(examSessionService).startSession(1, 10);
    }

    @Test
    void getQuestions_shouldReturnOk() throws Exception {
        setAuthenticatedUser("student01", 10);

        ExamQuestionResponseDTO.ShuffledAnswerDTO answer = ExamQuestionResponseDTO.ShuffledAnswerDTO.builder()
                .answerId(31)
                .orderIndex(1)
                .content("A")
                .imageUrl("a.png")
                .build();

        ExamQuestionResponseDTO question = ExamQuestionResponseDTO.builder()
                .variantQuestionId(201)
                .orderIndex(1)
                .content("2 + 2 = ?")
                .imageUrl("q.png")
                .isMultipleChoice(false)
                .answers(List.of(answer))
                .build();

        when(examSessionService.getQuestions(5, 10)).thenReturn(List.of(question));

        mockMvc.perform(get("/sessions/5/questions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].variantQuestionId").value(201))
                .andExpect(jsonPath("$[0].content").value("2 + 2 = ?"))
                .andExpect(jsonPath("$[0].answers[0].answerId").value(31));

        verify(examSessionService).getQuestions(5, 10);
    }

    @Test
    void submitSession_shouldReturnOk() throws Exception {
        setAuthenticatedUser("student01", 10);

        ExamSessionResponseDTO response = ExamSessionResponseDTO.builder()
                .id(100)
                .examId(1)
                .examTitle("Midterm")
                .userId(10)
                .userName("Student 01")
                .status("SUBMITTED")
                .build();

        when(examSessionService.submitSession(eq(100), eq(10), any())).thenReturn(response);

        String requestBody = """
                {
                  "answers": [
                    {
                      "variantQuestionId": 201,
                      "selectedAnswerIds": [31]
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/sessions/100/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        verify(examSessionService).submitSession(eq(100), eq(10), any());
    }

    @Test
        void submitSession_shouldReturnBadRequest_whenVariantQuestionIdMissing() throws Exception {
        mockMvc.perform(post("/sessions/100/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                                                .content("{\"answers\":[{}]}"))
                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("ID câu hỏi variant không được để trống"));
    }

    private void setAuthenticatedUser(String username, Integer userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(username, null, List.of())
        );

        User current = User.builder()
                .id(userId)
                .username(username)
                .name("Current User")
                .role(User.Role.STUDENT)
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(current));
    }
}