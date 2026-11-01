package com.gr1.exam.core.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình Swagger / SpringDoc OpenAPI.
 */
@Configuration
public class SwaggerConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI examOpenApi(@Value("${spring.application.name:exam}") String appName,
                               @Value("${server.servlet.context-path:}") String contextPath) {
        String docsPrefix = (contextPath == null || contextPath.isBlank()) ? "" : contextPath;

        return new OpenAPI()
            .info(new Info()
                .title(appName.toUpperCase() + " API")
                .version("v1")
                .description("Backend APIs cho hệ thống thi trắc nghiệm. "
                    + "Swagger UI: " + docsPrefix + "/swagger-ui/index.html")
                .contact(new Contact().name("GR1 Backend Team")))
            .components(new Components().addSecuritySchemes(
                SECURITY_SCHEME_NAME,
                new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Nhập JWT token (không cần prefix Bearer).")
            ))
            .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
    }
}
