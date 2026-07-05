package com.eventmanagement.websocket;

import com.eventmanagement.dto.ChatMessageRequest;
import com.eventmanagement.dto.ChatMessageResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class ChatController {

    @MessageMapping("/chat")
    @SendTo("/topic/chat")
    public ChatMessageResponse sendMessage(ChatMessageRequest request) {
        return new ChatMessageResponse(
                request.eventId(),
                request.senderId(),
                "user-" + request.senderId(),
                request.content(),
                LocalDateTime.now()
        );
    }
}
