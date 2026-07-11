package com.eventmanagement.dto;

import java.time.LocalDateTime;

import com.eventmanagement.entity.ChatMessage;
import com.eventmanagement.entity.ChatMessageType;

import java.time.LocalDateTime;

public record ChatMessageResponse(

        Long eventId,
        Long senderId,
        String senderUsername,

        String content,

        ChatMessageType type,

        LocalDateTime sentAt

) {

    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
                message.getEvent().getId(),
                message.getSender().getId(),
                message.getSender().getUsername(),
                message.getContent(),
                message.getType(),
                message.getSentAt()
        );
    }
}
