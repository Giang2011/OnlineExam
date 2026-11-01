package com.gr1.exam.external.vision.exception;

/**
 * Exception riêng cho lỗi tích hợp vision.
 */
public class VisionServiceException extends RuntimeException {
    public VisionServiceException(String message) {
        super(message);
    }

    public VisionServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
