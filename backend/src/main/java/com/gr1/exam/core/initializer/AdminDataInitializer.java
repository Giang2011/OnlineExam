package com.gr1.exam.core.initializer;

import com.gr1.exam.module.user.entity.User;
import com.gr1.exam.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Đồng bộ tài khoản admin từ application.properties mỗi lần ứng dụng khởi động.
 *
 * Mục tiêu:
 * - Nếu chưa có admin trong DB => tạo mới.
 * - Nếu đã có admin theo username cấu hình => cập nhật username/password/name/role nếu cần.
 *
 * Như vậy thay đổi `app.admin.username` hoặc `app.admin.password` trong properties
 * sẽ có tác dụng với tài khoản admin đang lưu trong database.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        User admin = userRepository.findByUsername(adminUsername)
                .or(() -> userRepository.findByRole(User.Role.ADMIN).stream().findFirst())
                .orElse(null);

        boolean created = false;
        if (admin == null) {
            admin = User.builder()
                    .username(adminUsername)
                    .name("admin")
                    .role(User.Role.ADMIN)
                    .build();
            created = true;
        }

        boolean changed = created;

        if (!adminUsername.equals(admin.getUsername())) {
            admin.setUsername(adminUsername);
            changed = true;
        }

        if (!"admin".equals(admin.getName())) {
            admin.setName("admin");
            changed = true;
        }

        if (admin.getRole() != User.Role.ADMIN) {
            admin.setRole(User.Role.ADMIN);
            changed = true;
        }

        if (admin.getPassword() == null || !passwordEncoder.matches(adminPassword, admin.getPassword())) {
            admin.setPassword(passwordEncoder.encode(adminPassword));
            changed = true;
        }

        userRepository.save(admin);

        if (created) {
            log.info("✅ Admin account created from properties: username={}", adminUsername);
        } else if (changed) {
            log.info("✅ Admin account synchronized with properties: username={}", adminUsername);
        } else {
            log.info("ℹ️ Admin account already synchronized: username={}", adminUsername);
        }
    }
}
