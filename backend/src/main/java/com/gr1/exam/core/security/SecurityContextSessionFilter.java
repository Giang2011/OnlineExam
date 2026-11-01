package com.gr1.exam.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter đồng bộ {@code SecurityContext} với {@code HttpSession}.
 *
 * <p>Mục đích:
 * <ul>
 *     <li>Đảm bảo {@code HttpSession} được tạo và mang ID cookie ngay khi user đã xác thực —
 *         nhờ vậy đóng trình duyệt rồi quay lại vẫn nhận diện được phiên cũ.</li>
 *     <li>Persist {@code SecurityContext} vào session để request kế tiếp nạp lại được
 *         (Spring Session JDBC lưu session ở bảng {@code SPRING_SESSION}).</li>
 * </ul>
 *
 * <p>Filter chạy SAU {@code SecurityContextHolderFilter} nên {@code SecurityContextHolder}
 * đã được populate sẵn từ session (nếu có).
 *
 * <p><b>Lưu ý hiệu năng:</b> chỉ ghi lại session khi context thực sự thay đổi hoặc session
 * chưa tồn tại — tránh ghi DB (Spring Session JDBC) ở mọi request.
 */
@Component
public class SecurityContextSessionFilter extends OncePerRequestFilter {

    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        SecurityContext context = SecurityContextHolder.getContext();
        Authentication authentication = context == null ? null : context.getAuthentication();

        if (isRealAuthentication(authentication)) {
            // Chạm vào session để Spring Session sinh session id và gắn cookie EXAMSESSION.
            boolean sessionExists = request.getSession(false) != null;
            if (!sessionExists) {
                request.getSession(true);
            }

            // Chỉ persist lại khi session chưa chứa context (đăng nhập mới, hoặc
            // context vừa thay đổi) — giảm số lần ghi DB xuống mức tối thiểu.
            if (!sessionExists || !securityContextRepository.containsContext(request)) {
                securityContextRepository.saveContext(context, request, response);
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRealAuthentication(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
