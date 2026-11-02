package com.gr1.exam.module.paperexam.controller;

import com.gr1.exam.core.exception.GlobalExceptionHandler;
import com.gr1.exam.module.paperexam.dto.PaperExamPdfMetaResponseDTO;
import com.gr1.exam.module.paperexam.service.PaperExamScanService;
import com.gr1.exam.module.paperexam.service.PaperExamService;
import com.gr1.exam.module.paperexam.service.PaperExamSheetService;
import com.gr1.exam.module.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test endpoint sinh phiếu OMR (`/omr-sheet`).
 */
@ExtendWith(MockitoExtension.class)
class PaperExamOmrSheetControllerTest {

    @Mock
    private PaperExamService paperExamService;
    @Mock
    private PaperExamScanService paperExamScanService;
    @Mock
    private PaperExamSheetService paperExamSheetService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PaperExamController paperExamController;

    private MockMvc mockMvc;

    private static final byte[] FAKE_PDF = "%PDF-1.4 fake".getBytes();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paperExamController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void downloadOmrSheet_shouldReturnPdfAttachment() throws Exception {
        when(paperExamSheetService.getOmrSheetPdfMeta(501)).thenReturn(meta());
        when(paperExamSheetService.generateOmrSheetPdf(eq(501), any())).thenReturn(FAKE_PDF);

        mockMvc.perform(get("/paper-exams/501/omr-sheet"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(content().bytes(FAKE_PDF));

        verify(paperExamSheetService).generateOmrSheetPdf(eq(501), any());
    }

    @Test
    void previewOmrSheet_shouldReturnPdfInline() throws Exception {
        when(paperExamSheetService.getOmrSheetPdfMeta(501)).thenReturn(meta());
        when(paperExamSheetService.generateOmrSheetPdf(eq(501), eq("S001"))).thenReturn(FAKE_PDF);

        mockMvc.perform(get("/paper-exams/501/omr-sheet/preview").param("studentId", "S001"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("inline")));
    }

    private PaperExamPdfMetaResponseDTO meta() {
        return PaperExamPdfMetaResponseDTO.builder()
                .paperExamId(501)
                .title("Đề OMR")
                .fileName("omr-501.pdf")
                .contentType("application/pdf")
                .build();
    }
}
