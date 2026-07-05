package com.eventmanagement.dto;

import com.eventmanagement.entity.Registration;
import com.eventmanagement.entity.RegistrationStatus;

import java.time.LocalDateTime;

public record RegistrationResponse(
        Long id,
        Long userId,
        Long eventId,
        RegistrationStatus status,
        LocalDateTime createdAt
) {
    public static RegistrationResponse from(Registration registration) {
        return new RegistrationResponse(
                registration.getId(),
                registration.getUser().getId(),
                registration.getEvent().getId(),
                registration.getStatus(),
                registration.getCreatedAt()
        );
    }
}
