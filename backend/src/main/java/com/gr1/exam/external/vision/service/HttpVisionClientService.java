package com.gr1.exam.external.vision.service;

import com.gr1.exam.external.vision.config.VisionProperties;
import com.gr1.exam.external.vision.dto.VisionRecognizedAnswerDTO;
import com.gr1.exam.external.vision.dto.VisionScanRequestDTO;
import com.gr1.exam.external.vision.dto.VisionScanResponseDTO;
import com.gr1.exam.external.vision.dto.VisionScanStatus;
import com.gr1.exam.external.vision.exception.VisionServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * HTTP client gọi Python vision service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HttpVisionClientService implements VisionClientService {

    private static final int DEFAULT_FORM_VARIANT = 75;
    private static final int MAX_ATTEMPTS = 2;

    private final VisionProperties visionProperties;
    private final RestTemplate restTemplate;

    @Override
    public VisionScanResponseDTO scanPaperExam(VisionScanRequestDTO request) {
        validateRequest(request);
        String url = buildScanUrl();

        VisionServiceException lastError = null;
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                VisionScanResponseDTO response = postScanRequest(url, request);
                log.info("Vision scan completed for paperExamId={}, status={}, attempt={}",
                        request.getPaperExamId(), response.getStatus(), attempt);
                return normalizeResponse(request, response);
            } catch (VisionServiceException ex) {
                lastError = ex;
                log.warn("Vision scan attempt {} failed for paperExamId={}: {}",
                        attempt, request.getPaperExamId(), ex.getMessage());
            }
        }

        throw lastError == null ? new VisionServiceException("Failed to call vision service") : lastError;
    }

    private void validateRequest(VisionScanRequestDTO request) {
        if (request == null) {
            throw new VisionServiceException("Vision scan request must not be null");
        }
        if (!visionProperties.isEnabled()) {
            throw new VisionServiceException("Vision service is disabled by configuration");
        }
        if (request.getPaperExamId() == null) {
            throw new VisionServiceException("paperExamId must not be null");
        }
        if (request.getActualQuestionCount() == null || request.getActualQuestionCount() <= 0) {
            throw new VisionServiceException("actualQuestionCount must be greater than 0");
        }
        MultipartFile image = request.getImage();
        if (image == null || image.isEmpty()) {
            throw new VisionServiceException("Image file must be provided");
        }
    }

    private String buildScanUrl() {
        return UriComponentsBuilder.fromHttpUrl(visionProperties.getServiceUrl())
                .path("/scan")
                .toUriString();
    }

    private VisionScanResponseDTO postScanRequest(String url, VisionScanRequestDTO request) {
        try {
            MultipartFile image = request.getImage();
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("paperExamId", request.getPaperExamId());
            body.add("actualQuestionCount", request.getActualQuestionCount());
            body.add("formVariant", request.getFormVariant() == null ? DEFAULT_FORM_VARIANT : request.getFormVariant());
            body.add("scanMode", request.getScanMode() == null ? "AUTO" : request.getScanMode());
            body.add("debug", request.getDebug() != null && request.getDebug());

            body.add("image", new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename() == null ? "scan-image.png" : image.getOriginalFilename();
                }
            });

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

            VisionScanResponseDTO response = restTemplate.postForObject(url, entity, VisionScanResponseDTO.class);
            if (response == null) {
                throw new VisionServiceException("Vision service returned an empty response");
            }
            return response;
        } catch (IOException ex) {
            throw new VisionServiceException("Failed to read uploaded image", ex);
        } catch (RestClientException ex) {
            throw new VisionServiceException(buildCallErrorMessage(ex), ex);
        }
    }

    private VisionScanResponseDTO normalizeResponse(VisionScanRequestDTO request, VisionScanResponseDTO response) {
        List<VisionRecognizedAnswerDTO> answers = response.getRecognizedAnswers() == null
                ? List.of()
                : new ArrayList<>(response.getRecognizedAnswers());

        VisionScanStatus status = response.getStatus() == null ? VisionScanStatus.FAILED_TO_READ : response.getStatus();
        Integer formVariant = response.getFormVariant() == null ?
                (request.getFormVariant() == null ? DEFAULT_FORM_VARIANT : request.getFormVariant())
                : response.getFormVariant();
        Integer actualQuestionCount = response.getActualQuestionCount() == null
                ? request.getActualQuestionCount()
                : response.getActualQuestionCount();

        return VisionScanResponseDTO.builder()
                .status(status)
                .paperExamId(response.getPaperExamId() == null ? request.getPaperExamId() : response.getPaperExamId())
                .formVariant(formVariant)
                .actualQuestionCount(actualQuestionCount)
                .recognizedAnswers(answers)
                .rawOutput(response.getRawOutput())
                .errors(response.getErrors())
                .build();
    }

    private String buildCallErrorMessage(RestClientException ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            return "Failed to call vision service";
        }
        return "Failed to call vision service: " + message;
    }
}
