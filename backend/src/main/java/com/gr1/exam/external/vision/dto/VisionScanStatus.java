package com.gr1.exam.external.vision.dto;

/**
 * Trạng thái chuẩn của một lần scan bằng vision.
 */
public enum VisionScanStatus {
    SUCCESS,
    FAILED_TO_READ,
    NEEDS_REVIEW,
    TIMEOUT,
    INVALID_IMAGE,
    SERVICE_UNAVAILABLE
}
