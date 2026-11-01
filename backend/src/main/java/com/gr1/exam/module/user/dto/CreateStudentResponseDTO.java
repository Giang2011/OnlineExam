package com.gr1.exam.module.user.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO: Response sau khi tạo Student — chứa credentials random (trả về 1 lần duy nhất).
 */
@Data
@Builder
public class CreateStudentResponseDTO {
    private Integer id;
    private String studentId;
    private String name;
    private String username;   // Random, trả về 1 lần duy nhất
    private String password;   // Random, trả về 1 lần duy nhất (plain text)
    private String role;
}
