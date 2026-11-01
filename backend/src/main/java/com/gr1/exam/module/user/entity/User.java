package com.gr1.exam.module.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.Where;

/**
 * Entity: Tài khoản người dùng.
 * Mapping: bảng `users`
 */
@Entity
@Table(name = "users")
@SQLDelete(sql = "UPDATE users SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String username;   // Tên đăng nhập (dùng để login)

    @Column(nullable = false)
    private String name;       // Tên hiển thị

    @Column(name = "student_id")
    private String studentId;  // MSSV — bắt buộc với STUDENT, null với ADMIN/TEACHER

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('STUDENT','TEACHER','ADMIN') DEFAULT 'STUDENT'")
    private Role role;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    public enum Role {
        STUDENT, TEACHER, ADMIN
    }
}
