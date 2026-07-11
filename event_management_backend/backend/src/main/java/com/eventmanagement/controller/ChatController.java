package com.eventmanagement.controller;

import com.eventmanagement.dto.ChatMessageRequest;
import com.eventmanagement.dto.ChatMessageResponse;
import com.eventmanagement.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public List<ChatMessageResponse> getMessages(@PathVariable Long eventId) {
        return chatService.getMessages(eventId);
    }

    @PostMapping
    public ChatMessageResponse sendMessage(
            @PathVariable Long eventId,
            @Valid @RequestBody ChatMessageRequest request
    ) {
        return chatService.sendMessage(eventId, request);
    }
}