package com.gr1.exam.module.paperexam.service;

import com.gr1.exam.core.exception.BadRequestException;
import com.gr1.exam.core.exception.ResourceNotFoundException;
import com.gr1.exam.external.vision.dto.VisionSheetGenerateResponseDTO;
import com.gr1.exam.external.vision.service.VisionSheetClientService;
import com.gr1.exam.module.paperexam.dto.PaperExamPdfMetaResponseDTO;
import com.gr1.exam.module.paperexam.entity.PaperExam;
import com.gr1.exam.module.paperexam.repository.PaperExamRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Base64;
import java.util.List;

/**
 * Sinh phiếu trả lời OMR (PDF) cho một đề giấy.
 *
 * Phiếu được vẽ bởi Python (SheetScanner) vì ArUco marker + QR chỉ có ở đó —
 * giữ `SheetScanner/omr/geometry.py` là nguồn sự thật duy nhất cho toạ độ ô tô.
 * Java chỉ nhận PNG base64 rồi gom vào PDF bằng openhtmltopdf.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaperExamSheetService {

    private final PaperExamRepository paperExamRepository;
    private final PaperExamOmrLayoutService omrLayoutService;
    private final VisionSheetClientService visionSheetClientService;

    @Transactional(readOnly = true)
    public byte[] generateOmrSheetPdf(Integer paperExamId, String studentId) {
        PaperExam paperExam = paperExamRepository.findById(paperExamId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề giấy không tìm thấy với id: " + paperExamId));

        int numQuestions = paperExam.getTotalQuestions() == null ? 0 : paperExam.getTotalQuestions();
        int choicesPerQ = omrLayoutService.resolveChoicesPerQ(paperExam);
        int questionsPerPage = omrLayoutService.resolveQuestionsPerPage(paperExam);
        String layoutJson = omrLayoutService.resolveLayoutJson(paperExam);

        VisionSheetGenerateResponseDTO generated;
        try {
            generated = visionSheetClientService.generateSheets(
                    examIdForQr(paperExam),
                    studentId,
                    numQuestions,
                    choicesPerQ,
                    questionsPerPage,
                    layoutJson);
        } catch (RuntimeException ex) {
            throw new BadRequestException("Không thể sinh phiếu OMR: " + ex.getMessage());
        }

        List<String> pages = generated.getPages();
        if (pages == null || pages.isEmpty()) {
            throw new BadRequestException("Vision service không trả về trang phiếu nào.");
        }

        String html = buildSheetHtml(paperExam, pages, studentId, generated.getPageCount());
        return renderPdf(html);
    }

    @Transactional(readOnly = true)
    public PaperExamPdfMetaResponseDTO getOmrSheetPdfMeta(Integer paperExamId) {
        PaperExam paperExam = paperExamRepository.findById(paperExamId)
                .orElseThrow(() -> new ResourceNotFoundException("Đề giấy không tìm thấy với id: " + paperExamId));

        return PaperExamPdfMetaResponseDTO.builder()
                .paperExamId(paperExam.getId())
                .title(paperExam.getTitle())
                .totalPages(null)
                .fileName(buildSafeFileName(paperExam.getTitle(), paperExam.getId()))
                .contentType("application/pdf")
                .build();
    }

    /** Mã đề nhúng trong QR của phiếu. */
    private String examIdForQr(PaperExam paperExam) {
        return "EXAM-" + paperExam.getId();
    }

    private String buildSheetHtml(PaperExam paperExam, List<String> pages, String studentId, Integer pageCount) {
        StringBuilder images = new StringBuilder();
        for (String encoded : pages) {
            images.append("<div class='page'><img src='data:image/png;base64,")
                    .append(encoded)
                    .append("' alt='omr-sheet' /></div>");
        }

        int total = pages.size();
        String header = "<div class='meta'>Mã đề: " + escapeHtml(examIdForQr(paperExam))
                + " | Số câu: " + (paperExam.getTotalQuestions() == null ? total : paperExam.getTotalQuestions())
                + " | Số trang: " + total
                + (studentId == null || studentId.isBlank() ? "" : " | Mã thí sinh: " + escapeHtml(studentId))
                + "</div>";

        String template = readTemplateOrDefault("templates/paperexam/omr-sheet-template.html");
        return template
                .replace("{{TITLE}}", escapeHtml(paperExam.getTitle()))
                .replace("{{META}}", header)
                .replace("{{PAGES_BLOCK}}", images.toString());
    }

    private byte[] renderPdf(String html) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);

            useAppFont(builder);

            builder.toStream(baos);
            builder.run();
            return baos.toByteArray();
        } catch (Exception ex) {
            throw new BadRequestException("Không thể tạo PDF phiếu OMR: " + ex.getMessage());
        }
    }

    /**
     * Nạp font Noto Sans từ classpath.
     *
     * Phải đọc qua `getInputStream()` chứ không dùng `getFile()`: khi chạy từ file
     * jar, resource nằm trong jar (jar:nested:...) nên không có đường dẫn hệ thống.
     */
    private void useAppFont(PdfRendererBuilder builder) {
        ClassPathResource fontResource = new ClassPathResource("fonts/NotoSans-Regular.ttf");
        if (!fontResource.exists()) {
            return;
        }
        try (InputStream in = fontResource.getInputStream()) {
            byte[] fontBytes = in.readAllBytes();
            // Supplier tạo lại stream mỗi lần renderer cần, nên phải nạp vào memory.
            builder.useFont(() -> new ByteArrayInputStream(fontBytes), "Noto Sans");
        } catch (IOException ex) {
            log.warn("Không nạp được font Noto Sans, PDF sẽ dùng font mặc định: {}", ex.getMessage());
        }
    }

    private String readTemplateOrDefault(String classpathLocation) {
        try {
            ClassPathResource resource = new ClassPathResource(classpathLocation);
            if (resource.exists()) {
                try (InputStream in = resource.getInputStream()) {
                    return new String(in.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        } catch (Exception ignored) {
            // fallback template below
        }

        return "<!doctype html><html><head><meta charset='UTF-8'/><style>"
                + "@page{size:A4;margin:0;}body{font-family:'Noto Sans','Roboto','Arial',sans-serif;margin:0;}"
                + ".meta{font-size:11px;color:#333;padding:4px 8px;}"
                + ".page{page-break-after:always;margin:0;padding:0;}"
                + ".page:last-child{page-break-after:auto;}"
                + "img{width:100%;display:block;}"
                + "</style></head><body><div class='meta'>{{META}}</div>{{PAGES_BLOCK}}</body></html>";
    }

    private String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String buildSafeFileName(String title, Integer id) {
        String normalized = Normalizer.normalize(title == null ? "omr-sheet" : title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase();
        String slug = normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (slug.isBlank()) {
            slug = "omr-sheet";
        }
        return slug + "-" + id + "-omr.pdf";
    }
}
