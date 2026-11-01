package com.gr1.exam.external.vision.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình cho vision service.
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.vision")
public class VisionProperties {
    private String serviceUrl = "http://localhost:8000";
    private int connectTimeoutMs = 5000;
    private int readTimeoutMs = 30000;
    private boolean enabled = true;
}
