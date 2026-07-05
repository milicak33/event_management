package com.eventmanagement.dto;

import com.eventmanagement.entity.User;
import com.eventmanagement.entity.UserRole;

public record UserResponse(
        Long id,
        String username,
        String email,
        UserRole role
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );
    }
}
