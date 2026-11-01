package com.gr1.exam.module.paperexam.controller;

import com.gr1.exam.core.exception.UnauthorizedException;
import com.gr1.exam.module.paperexam.dto.PaperExamAnswerViewResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamPdfMetaResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamPreviewResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamRequestDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamResponseDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamScanRequestDTO;
import com.gr1.exam.module.paperexam.dto.PaperExamScanResponseDTO;
import com.gr1.exam.module.paperexam.service.PaperExamScanService;
import com.gr1.exam.module.paperexam.service.PaperExamService;
import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/paper-exams")
@RequiredArgsConstructor
public class PaperExamController {

    private final PaperExamService paperExamService;
    private final PaperExamScanService paperExamScanService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<PaperExamResponseDTO> createPaperExam(@RequestBody PaperExamRequestDTO request) {
        return ResponseEntity.ok(paperExamService.createPaperExam(request, getCurrentUserId()));
    }

    @GetMapping
    public ResponseEntity<List<PaperExamResponseDTO>> getPaperExams() {
        return ResponseEntity.ok(paperExamService.getPaperExams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaperExamResponseDTO> getPaperExamById(@PathVariable Integer id) {
        return ResponseEntity.ok(paperExamService.getPaperExamById(id));
    }

    @GetMapping("/{id}/answers")
    public ResponseEntity<PaperExamAnswerViewResponseDTO> getPaperExamAnswers(@PathVariable Integer id) {
        return ResponseEntity.ok(paperExamService.getPaperExamAnswerView(id));
    }

    @GetMapping("/{id}/scan-results")
    public ResponseEntity<List<PaperExamScanResponseDTO>> listPaperExamScanResults(@PathVariable Integer id) {
        return ResponseEntity.ok(paperExamScanService.listPaperExamScanResults(id));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPaperExamPdf(@PathVariable Integer id) {
        PaperExamPdfMetaResponseDTO meta = paperExamService.getPaperExamPdfMeta(id);
        byte[] pdf = paperExamService.generatePaperExamPdf(id);

        return buildPdfResponse(meta, pdf, true);
    }

    @GetMapping("/{id}/pdf/preview")
    public ResponseEntity<byte[]> previewPaperExamPdf(@PathVariable Integer id) {
        PaperExamPdfMetaResponseDTO meta = paperExamService.getPaperExamPdfMeta(id);
        byte[] pdf = paperExamService.generatePaperExamPdf(id);

        return buildPdfResponse(meta, pdf, false);
    }

    @PostMapping(value = "/{id}/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PaperExamScanResponseDTO> scanPaperExam(
            @PathVariable Integer id,
            @RequestParam("image") org.springframework.web.multipart.MultipartFile image,
            @RequestParam(value = "actualQuestionCount", required = false) Integer actualQuestionCount,
            @RequestParam(value = "formVariant", required = false) Integer formVariant,
            @RequestParam(value = "debug", required = false, defaultValue = "false") Boolean debug,
            @RequestParam(value = "scanMode", required = false, defaultValue = "AUTO") String scanMode) {
        PaperExamScanRequestDTO request = new PaperExamScanRequestDTO();
        request.setActualQuestionCount(actualQuestionCount);
        request.setFormVariant(formVariant);
        request.setDebug(debug);
        request.setScanMode(scanMode);
        return ResponseEntity.ok(paperExamScanService.scanPaperExam(id, image, request));
    }

    @GetMapping("/scan-results/{scanResultId}")
    public ResponseEntity<PaperExamScanResponseDTO> getPaperExamScanResult(@PathVariable Integer scanResultId) {
        return ResponseEntity.ok(paperExamScanService.getPaperExamScanResult(scanResultId));
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaperExam(@PathVariable Integer id) {
        paperExamService.softDeletePaperExam(id);
        return ResponseEntity.noContent().build();
    }

    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Không tìm thấy thông tin người dùng hiện tại."));
        return user.getId();
    }

    private ResponseEntity<byte[]> buildPdfResponse(PaperExamPdfMetaResponseDTO meta, byte[] pdf, boolean asAttachment) {
        ContentDisposition disposition = asAttachment
                ? ContentDisposition.attachment().filename(meta.getFileName()).build()
                : ContentDisposition.inline().filename(meta.getFileName()).build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(pdf);
    }
}
