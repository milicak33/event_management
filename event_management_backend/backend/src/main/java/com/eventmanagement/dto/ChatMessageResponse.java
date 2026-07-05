package com.eventmanagement.dto;

import java.time.LocalDateTime;

public record ChatMessageResponse(
        Long eventId,
        Long senderId,
        String senderUsername,
        String content,
        LocalDateTime sentAt
) {}
