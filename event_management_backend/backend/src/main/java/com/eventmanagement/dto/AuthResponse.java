package com.eventmanagement.dto;

import com.eventmanagement.entity.UserRole;

public record AuthResponse(
        String token,
        Long userId,
        String username,
        String email,
        UserRole role
) {}
