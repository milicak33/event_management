package com.eventmanagement.dto;

import com.eventmanagement.entity.ChatMessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChatMessageRequest(

        @NotBlank
        String content,

        @NotNull
        ChatMessageType type

) {}