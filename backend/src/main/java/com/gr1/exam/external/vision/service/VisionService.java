package com.gr1.exam.external.vision.service;

import com.gr1.exam.external.vision.dto.VisionRequestDTO;
import com.gr1.exam.external.vision.dto.VisionResponseDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Service gọi API Python Vision microservice để xử lý OCR / Object Detection.
 */
@Service
public class VisionService {

    private final RestTemplate restTemplate;

    // TODO: Cấu hình URL Python service qua application.properties
    // @Value("${app.vision.service-url}")
    // private String visionServiceUrl;

    public VisionService() {
        this.restTemplate = new RestTemplate();
    }

    // TODO: processAnswerSheet(VisionRequestDTO request) → VisionResponseDTO
    //       Gửi ảnh phiếu trả lời → nhận kết quả nhận dạng

    // TODO: extractQuestionsFromPDF(byte[] pdfBytes) → List<QuestionRequestDTO>
    //       (Roadmap) Trích xuất câu hỏi từ PDF/ảnh scan
}
