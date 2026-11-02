package com.gr1.exam.external.vision.service;

import com.gr1.exam.external.vision.config.VisionProperties;
import com.gr1.exam.external.vision.dto.VisionSheetGenerateResponseDTO;
import com.gr1.exam.external.vision.exception.VisionServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

/**
 * Client gọi endpoint sinh phiếu OMR (`/sheets/generate`) của Python vision service.
 *
 * Phiếu được sinh ở Python vì ArUco marker + QR chỉ có ở đó — giữ
 * `SheetScanner/omr/geometry.py` là nguồn sự thật duy nhất cho toạ độ ô tô.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VisionSheetClientService {

    private final VisionProperties visionProperties;
    private final RestTemplate restTemplate;

    public VisionSheetGenerateResponseDTO generateSheets(
            String examId,
            String studentId,
            int numQuestions,
            int choicesPerQ,
            int questionsPerPage,
            String layoutJson) {

        if (!visionProperties.isEnabled()) {
            throw new VisionServiceException("Vision service is disabled by configuration");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("examId", examId);
        body.put("studentId", studentId);
        body.put("numQuestions", numQuestions);
        body.put("choicesPerQ", choicesPerQ);
        body.put("questionsPerPage", questionsPerPage);
        if (layoutJson != null && !layoutJson.isBlank()) {
            body.put("layout", parseLayout(layoutJson));
        }

        String url = UriComponentsBuilder.fromHttpUrl(visionProperties.getServiceUrl())
                .path("/sheets/generate")
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        log.debug("Gửi yêu cầu sinh phiếu OMR tới {} với body: {}", url, body);

        try {
            VisionSheetGenerateResponseDTO response = restTemplate.postForObject(
                    url, new HttpEntity<>(body, headers), VisionSheetGenerateResponseDTO.class);
            if (response == null || response.getPages() == null || response.getPages().isEmpty()) {
                throw new VisionServiceException("Vision service returned no sheet pages");
            }
            return response;
        } catch (RestClientException ex) {
            String message = ex.getMessage();
            throw new VisionServiceException("Failed to call vision service: "
                    + (message == null || message.isBlank() ? "unknown error" : message), ex);
        }
    }

    /**
     * Layout JSON lưu trong DB dùng key snake_case (đúng như Python mong đợi) nên
     * gửi thẳng làm object. Nếu không parse được thì gửi nguyên chuỗi để Python
     * tự báo lỗi rõ ràng.
     */
    @SuppressWarnings("unchecked")
    private Object parseLayout(String layoutJson) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(layoutJson, Map.class);
        } catch (Exception ex) {
            log.warn("OMR layout is not valid JSON, sending it as-is: {}", ex.getMessage());
            return layoutJson;
        }
    }
}
