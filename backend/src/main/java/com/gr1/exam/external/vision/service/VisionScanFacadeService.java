package com.gr1.exam.external.vision.service;

import com.gr1.exam.external.vision.dto.VisionScanRequestDTO;
import com.gr1.exam.external.vision.dto.VisionScanResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Facade để module khác chỉ gọi một entrypoint duy nhất.
 */
@Service
@RequiredArgsConstructor
public class VisionScanFacadeService {

    private final VisionClientService visionClientService;

    public VisionScanResponseDTO scanPaperExam(VisionScanRequestDTO request) {
        return visionClientService.scanPaperExam(request);
    }
}
