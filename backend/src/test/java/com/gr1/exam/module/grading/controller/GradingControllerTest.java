package com.gr1.exam.module.grading.controller;

import com.gr1.exam.core.exception.GlobalExceptionHandler;
import com.gr1.exam.module.grading.dto.ExamResultsResponseDTO;
import com.gr1.exam.module.grading.dto.ResultResponseDTO;
import com.gr1.exam.module.grading.service.GradingService;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GradingControllerTest {

    @Mock
    private GradingService gradingService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GradingController gradingController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(gradingController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getResultBySession_shouldReturnOk() throws Exception {
        ResultResponseDTO response = ResultResponseDTO.builder()
                .id(1)
                .examSessionId(7)
                .examTitle("Midterm")
                .studentName("Student A")
                .score(8.5f)
                .totalCorrect(17)
                .totalQuestions(20)
                .submittedAt(LocalDateTime.now())
                .build();

        when(gradingService.getResultBySession(7)).thenReturn(response);

        mockMvc.perform(get("/results/session/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.examSessionId").value(7))
                .andExpect(jsonPath("$.examTitle").value("Midterm"))
                .andExpect(jsonPath("$.score").value(8.5));

        verify(gradingService).getResultBySession(7);
    }

    @Test
    void getResultsByExam_shouldReturnOk_whenAdminRole() throws Exception {
        setAuthentication("admin01", List.of("ROLE_ADMIN"));

        ExamResultsResponseDTO response = ExamResultsResponseDTO.builder()
                .examId(5)
                .examTitle("Final")
                .statistics(ExamResultsResponseDTO.StatisticsDTO.builder()
                        .average(7.5f)
                        .highest(9.0f)
                        .lowest(6.0f)
                        .totalSubmitted(2)
                        .distribution(ExamResultsResponseDTO.ScoreDistributionDTO.builder()
                                .from0To2(0)
                                .from2To4(0)
                                .from4To6(0)
                                .from6To8(1)
                                .from8To10(1)
                                .build())
                        .build())
                .results(List.of())
                .build();

        when(gradingService.getResultsByExam(5)).thenReturn(response);

        mockMvc.perform(get("/results/exam/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.examId").value(5))
                .andExpect(jsonPath("$.examTitle").value("Final"))
                .andExpect(jsonPath("$.statistics.average").value(7.5));

        verify(gradingService).getResultsByExam(5);
    }

    @Test
    void getResultsByExam_shouldReturnOk_whenTeacherRole() throws Exception {
        setAuthentication("teacher01", List.of("ROLE_TEACHER"));

        ExamResultsResponseDTO response = ExamResultsResponseDTO.builder()
                .examId(9)
                .examTitle("Quiz")
                .statistics(ExamResultsResponseDTO.StatisticsDTO.builder()
                        .average(0.0f)
                        .highest(0.0f)
                        .lowest(0.0f)
                        .totalSubmitted(0)
                        .distribution(ExamResultsResponseDTO.ScoreDistributionDTO.builder()
                                .from0To2(0)
                                .from2To4(0)
                                .from4To6(0)
                                .from6To8(0)
                                .from8To10(0)
                                .build())
                        .build())
                .results(List.of())
                .build();

        when(gradingService.getResultsByExam(9)).thenReturn(response);

        mockMvc.perform(get("/results/exam/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.examId").value(9));

        verify(gradingService).getResultsByExam(9);
    }

    @Test
    void getResultsByExam_shouldReturnUnauthorized_whenStudentRole() throws Exception {
        setAuthentication("student01", List.of("ROLE_STUDENT"));

        mockMvc.perform(get("/results/exam/5"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Bạn không có quyền truy cập tài nguyên này."));

        verifyNoInteractions(gradingService);
    }

    @Test
    void getMyResults_shouldReturnOk() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("student01", null, List.of())
        );

        User current = User.builder()
                .id(10)
                .username("student01")
                .name("Student 01")
                .role(User.Role.STUDENT)
                .build();

        ResultResponseDTO dto = ResultResponseDTO.builder()
                .id(101)
                .examSessionId(201)
                .examTitle("Midterm")
                .studentName("Student 01")
                .score(9.0f)
                .totalCorrect(18)
                .totalQuestions(20)
                .submittedAt(LocalDateTime.now())
                .build();

        when(userRepository.findByUsername("student01")).thenReturn(Optional.of(current));
        when(gradingService.getMyResults(10)).thenReturn(List.of(dto));

        mockMvc.perform(get("/results/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(101))
                .andExpect(jsonPath("$[0].examTitle").value("Midterm"))
                .andExpect(jsonPath("$[0].score").value(9.0));

        verify(gradingService).getMyResults(10);
    }

    @Test
    void getMyResults_shouldReturnUnauthorized_whenCurrentUserMissing() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("ghost", null, List.of())
        );

        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        mockMvc.perform(get("/results/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Không tìm thấy thông tin người dùng hiện tại."));

        verifyNoInteractions(gradingService);
    }

    private void setAuthentication(String username, List<String> authorities) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        authorities.stream().map(SimpleGrantedAuthority::new).toList()
                )
        );
    }
}
