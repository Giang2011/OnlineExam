package com.gr1.exam.external.vision.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Bean configuration cho vision client.
 */
@Configuration
public class VisionClientConfig {

    @Bean
    public RestTemplate visionRestTemplate(VisionProperties visionProperties, RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofMillis(visionProperties.getConnectTimeoutMs()))
                .setReadTimeout(Duration.ofMillis(visionProperties.getReadTimeoutMs()))
                .build();
    }
}
