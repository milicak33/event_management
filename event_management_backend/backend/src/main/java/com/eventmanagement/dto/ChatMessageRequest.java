package com.eventmanagement.dto;

public record ChatMessageRequest(
        Long eventId,
        Long senderId,
        String content
) {}
