package com.gr1.exam.external.vision.service;

import com.gr1.exam.external.vision.dto.VisionScanRequestDTO;
import com.gr1.exam.external.vision.dto.VisionScanResponseDTO;

/**
 * Contract cho client gọi vision service.
 */
public interface VisionClientService {
    VisionScanResponseDTO scanPaperExam(VisionScanRequestDTO request);
}
