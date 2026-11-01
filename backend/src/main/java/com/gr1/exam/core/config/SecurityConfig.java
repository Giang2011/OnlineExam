package com.gr1.exam.core.config;

import com.gr1.exam.core.security.SecurityContextSessionFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gr1.exam.core.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.context.SecurityContextHolderFilter;

import java.time.LocalDateTime;

/**
 * Cấu hình Spring Security — xác thực bằng cookie HttpSession (Spring Session JDBC).
 *
 * <p>Không còn JWT. Nguồn xác thực duy nhất là cookie phiên {@code EXAMSESSION}
 * (HttpOnly) do Spring Session JDBC quản lý trong bảng {@code SPRING_SESSION}.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ObjectMapper objectMapper;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * Repository lưu SecurityContext vào HttpSession.
     * Spring Security 6 yêu cầu save tường minh (requireExplicitSave) nên bean này
     * được inject vào controller login để persist context sau khi xác thực thành công.
     */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           SecurityContextRepository securityContextRepository,
                                           SecurityContextSessionFilter securityContextSessionFilter) throws Exception {
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookieCustomizer(cookie -> cookie.sameSite("Lax").path("/"));

        CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();
        // Cho phép đọc token từ header X-XSRF-TOKEN (đọc trực tiếp, không cần param).
        csrfRequestHandler.setCsrfRequestAttributeName(null);

        http
            .cors(org.springframework.security.config.Customizer.withDefaults())
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(csrfRequestHandler)
                // Endpoint login chưa có phiên nên không thể có CSRF token hợp lệ.
                // Bỏ qua CSRF cho login/logout; các API nghiệp vụ vẫn được bảo vệ.
                .ignoringRequestMatchers("/auth/login", "/auth/logout"))
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .securityContext(sc -> sc.securityContextRepository(securityContextRepository))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint())
                .accessDeniedHandler(accessDeniedHandler()))
            .authorizeHttpRequests(auth -> auth
                // Authentication — Chỉ login (không có register)
                .requestMatchers("/auth/login", "/auth/logout").permitAll()

                // Swagger / OpenAPI endpoints — Public
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // Uploads — Public (serve static files)
                .requestMatchers("/uploads/**").permitAll()

                // Tạo student — ADMIN/TEACHER
                .requestMatchers(HttpMethod.POST, "/users/students").hasAnyRole("ADMIN", "TEACHER")
                // Tạo teacher — ADMIN only
                .requestMatchers(HttpMethod.POST, "/users/teachers").hasRole("ADMIN")
                // Teacher tự cập nhật — ADMIN/TEACHER
                .requestMatchers(HttpMethod.PUT, "/users/me").hasAnyRole("ADMIN", "TEACHER")
                // Sửa/xóa user — ADMIN only
                .requestMatchers(HttpMethod.PUT, "/users/{id}").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/users/{id}").hasRole("ADMIN")
                // Xem danh sách — ADMIN/TEACHER
                .requestMatchers(HttpMethod.GET, "/users/**").hasAnyRole("ADMIN", "TEACHER")

                // Subjects & Chapters — ADMIN/TEACHER
                .requestMatchers("/subjects/**").hasAnyRole("ADMIN", "TEACHER")

                // Questions — ADMIN/TEACHER
                .requestMatchers("/questions/**").hasAnyRole("ADMIN", "TEACHER")

                // Exams — GET authenticated (Student xem kỳ thi được tham gia), write ADMIN/TEACHER
                .requestMatchers(HttpMethod.GET, "/exams/**").authenticated()
                .requestMatchers("/exams/**").hasAnyRole("ADMIN", "TEACHER")

                // Sessions — STUDENT
                .requestMatchers("/sessions/**").hasRole("STUDENT")

                // Results — authenticated (logic phân quyền chi tiết trong service/controller)
                .requestMatchers("/results/**").authenticated()

                // Paper exam scan results — chỉ ADMIN/TEACHER
                .requestMatchers(HttpMethod.GET, "/paper-exams/*/scan-results").hasAnyRole("ADMIN", "TEACHER")
                .requestMatchers(HttpMethod.GET, "/paper-exams/scan-results/*").hasAnyRole("ADMIN", "TEACHER")

                // Mọi request khác cần xác thực
                .anyRequest().authenticated()
            )
            // Đảm bảo session được tạo + SecurityContext được persist sau khi xác thực
            .addFilterAfter(securityContextSessionFilter, SecurityContextHolderFilter.class);

        return http.build();
    }

    /**
     * Trả 401 (thay vì 403) khi request chưa xác thực — frontend dựa vào 401 để redirect login.
     */
    private AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
        };
    }

    private AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            writeError(response, HttpServletResponse.SC_FORBIDDEN,
                    "Bạn không có quyền thực hiện thao tác này.");
        };
    }

    private void writeError(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ErrorResponse error = new ErrorResponse(status, message);
        error.setTimestamp(LocalDateTime.now());
        objectMapper.writeValue(response.getWriter(), error);
    }
}
