package com.eventmanagement.dto;

import com.eventmanagement.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateUserRequest(
        @NotBlank String username,
        @Email @NotBlank String email,
        @NotBlank String password,
        @NotNull UserRole role
) {}
