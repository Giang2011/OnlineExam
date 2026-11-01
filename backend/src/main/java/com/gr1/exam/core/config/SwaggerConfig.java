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
 *
 * <p>Xác thực bằng cookie phiên — không còn bearer/JWT.
 */
@Configuration
public class SwaggerConfig {

    private static final String SESSION_SCHEME_NAME = "sessionCookie";
    private static final String CSRF_SCHEME_NAME = "csrfToken";

    @Bean
    public OpenAPI examOpenApi(@Value("${spring.application.name:exam}") String appName,
                               @Value("${server.servlet.context-path:}") String contextPath) {
        String docsPrefix = (contextPath == null || contextPath.isBlank()) ? "" : contextPath;

        return new OpenAPI()
            .info(new Info()
                .title(appName.toUpperCase() + " API")
                .version("v1")
                .description("Backend APIs cho hệ thống thi trắc nghiệm. "
                    + "Xác thực bằng cookie phiên (HttpOnly) sau khi POST /auth/login. "
                    + "Swagger UI: " + docsPrefix + "/swagger-ui/index.html")
                .contact(new Contact().name("GR1 Backend Team")))
            .components(new Components()
                .addSecuritySchemes(SESSION_SCHEME_NAME,
                    new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.COOKIE)
                        .name("EXAMSESSION")
                        .description("Cookie phiên do POST /auth/login cấp (HttpOnly). "
                            + "Trong Swagger UI, dùng authorize để set cookie."))
                .addSecuritySchemes(CSRF_SCHEME_NAME,
                    new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.HEADER)
                        .name("X-XSRF-TOKEN")
                        .description("CSRF token lấy từ cookie XSRF-TOKEN; "
                            + "gửi kèm mọi request mutation (POST/PUT/DELETE).")))
            .addSecurityItem(new SecurityRequirement()
                .addList(SESSION_SCHEME_NAME)
                .addList(CSRF_SCHEME_NAME));
    }
}
