package com.gr1.exam.module.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class LoginResponseDTO {
    private String token;
    private String tokenType;
    private UserResponseDTO user;
}
