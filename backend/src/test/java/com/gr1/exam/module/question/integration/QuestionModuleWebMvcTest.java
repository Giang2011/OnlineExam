package com.gr1.exam.module.question.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.security.JwtAuthenticationFilter;
import com.gr1.exam.module.question.controller.QuestionController;
import com.gr1.exam.module.question.controller.SubjectController;
import com.gr1.exam.module.question.dto.QuestionRequestDTO;
import com.gr1.exam.module.question.dto.QuestionResponseDTO;
import com.gr1.exam.module.question.dto.SubjectRequestDTO;
import com.gr1.exam.module.question.dto.SubjectResponseDTO;
import com.gr1.exam.module.question.service.QuestionService;
import com.gr1.exam.module.question.service.SubjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {SubjectController.class, QuestionController.class})
@AutoConfigureMockMvc(addFilters = false)
class QuestionModuleWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SubjectService subjectService;

    @MockBean
    private QuestionService questionService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void createSubject_shouldReturn201() throws Exception {
        SubjectRequestDTO request = new SubjectRequestDTO();
        request.setName("Toan");

        when(subjectService.createSubject(any(SubjectRequestDTO.class)))
                .thenReturn(SubjectResponseDTO.builder().id(1).name("Toan").build());

        mockMvc.perform(post("/api/v1/subjects")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Toan"));
    }

    @Test
    void createSubject_shouldReturn400_whenValidationFails() throws Exception {
        mockMvc.perform(post("/api/v1/subjects")
                        .contextPath("/api/v1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAllQuestions_shouldReturnPagedData() throws Exception {
        QuestionResponseDTO dto = QuestionResponseDTO.builder()
                .id(10)
                .content("2+2=?")
                .subjectId(1)
                .subjectName("Toan")
                .chapterId(2)
                .chapterName("Dai so")
                .answers(List.of())
                .build();

        when(questionService.getAllQuestions(eq(1), eq(2), eq("2"), any()))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/v1/questions")
                        .contextPath("/api/v1")
                        .param("subjectId", "1")
                        .param("chapterId", "2")
                        .param("keyword", "2")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(10))
                .andExpect(jsonPath("$.content[0].subjectName").value("Toan"))
                .andExpect(jsonPath("$.content[0].chapterName").value("Dai so"));
    }

    @Test
    void createQuestion_shouldReturn201() throws Exception {
        QuestionRequestDTO request = new QuestionRequestDTO();
        request.setContent("2 + 2 = ?");
        request.setSubjectId(1);
        request.setChapterId(2);

        QuestionRequestDTO.AnswerDTO a1 = new QuestionRequestDTO.AnswerDTO();
        a1.setContent("3");
        a1.setIsCorrect(false);

        QuestionRequestDTO.AnswerDTO a2 = new QuestionRequestDTO.AnswerDTO();
        a2.setContent("4");
        a2.setIsCorrect(true);

        request.setAnswers(List.of(a1, a2));

        QuestionResponseDTO response = QuestionResponseDTO.builder()
                .id(22)
                .content("2 + 2 = ?")
                .imageUrl("/uploads/questions/q1.png")
                .subjectId(1)
                .subjectName("Toan")
                .chapterId(2)
                .chapterName("Dai so")
                .answers(List.of())
                .build();

        when(questionService.createQuestion(any(QuestionRequestDTO.class), any(), any())).thenReturn(response);

        MockMultipartFile data = new MockMultipartFile(
                "data",
                "",
                MediaType.TEXT_PLAIN_VALUE,
                objectMapper.writeValueAsString(request).getBytes(StandardCharsets.UTF_8)
        );
        MockMultipartFile questionImage = new MockMultipartFile(
                "questionImage",
                "q1.png",
                MediaType.IMAGE_PNG_VALUE,
                "question-image".getBytes(StandardCharsets.UTF_8)
        );
        MockMultipartFile answerImage1 = new MockMultipartFile(
                "answerImages",
                "a1.png",
                MediaType.IMAGE_PNG_VALUE,
                "answer-image-1".getBytes(StandardCharsets.UTF_8)
        );
        MockMultipartFile answerImage2 = new MockMultipartFile(
                "answerImages",
                "a2.png",
                MediaType.IMAGE_PNG_VALUE,
                "answer-image-2".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/v1/questions")
                        .file(data)
                        .file(questionImage)
                        .file(answerImage1)
                        .file(answerImage2)
                        .contextPath("/api/v1")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(22))
                .andExpect(jsonPath("$.subjectName").value("Toan"));
    }

    @Test
    void createQuestion_shouldReturn400_whenMissingChapterId() throws Exception {
        QuestionRequestDTO request = new QuestionRequestDTO();
        request.setContent("2 + 2 = ?");
        request.setSubjectId(1);

        QuestionRequestDTO.AnswerDTO a1 = new QuestionRequestDTO.AnswerDTO();
        a1.setContent("3");
        a1.setIsCorrect(false);

        QuestionRequestDTO.AnswerDTO a2 = new QuestionRequestDTO.AnswerDTO();
        a2.setContent("4");
        a2.setIsCorrect(true);

        request.setAnswers(List.of(a1, a2));

        MockMultipartFile data = new MockMultipartFile(
                "data",
                "",
                MediaType.TEXT_PLAIN_VALUE,
                objectMapper.writeValueAsString(request).getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/v1/questions")
                        .file(data)
                        .contextPath("/api/v1")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteSubject_shouldReturn204() throws Exception {
        doNothing().when(subjectService).deleteSubject(3);

        mockMvc.perform(delete("/api/v1/subjects/3")
                        .contextPath("/api/v1"))
                .andExpect(status().isNoContent());
    }
}
