package com.gr1.exam.core.config;

import com.gr1.exam.core.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(org.springframework.security.config.Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Authentication — Chỉ login (không có register)
                .requestMatchers("/auth/login").permitAll()

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
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
