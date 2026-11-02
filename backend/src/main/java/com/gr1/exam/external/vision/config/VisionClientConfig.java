package com.gr1.exam.external.vision.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Bean configuration cho vision client.
 */
@Configuration
public class VisionClientConfig {

    /**
     * RestTemplate gọi Python OMR service.
     *
     * Bắt buộc ép **HTTP/1.1**: JDK HttpClient (mặc định của Spring Boot 3.5+) sẽ thử
     * nâng cấp `Upgrade: h2c` khi gặp server không hỗ trợ HTTP/2. Uvicorn không hiểu
     * `h2c` và sẽ báo "Invalid HTTP request received", khiến body (multipart/JSON)
     * không bao giờ tới được — request chết với lỗi "header parser received no bytes".
     */
    @Bean
    public RestTemplate visionRestTemplate(VisionProperties visionProperties, RestTemplateBuilder builder) {
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofMillis(visionProperties.getConnectTimeoutMs()))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(visionProperties.getReadTimeoutMs()));

        return builder
                .requestFactory(() -> requestFactory)
                .build();
    }
}
