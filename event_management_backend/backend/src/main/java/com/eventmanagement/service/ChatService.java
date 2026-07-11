package com.eventmanagement.service;

import com.eventmanagement.dto.ChatMessageRequest;
import com.eventmanagement.dto.ChatMessageResponse;
import com.eventmanagement.entity.ChatMessage;
import com.eventmanagement.entity.ChatMessageType;
import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.User;
import com.eventmanagement.entity.UserRole;
import com.eventmanagement.repository.ChatMessageRepository;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse sendMessage(Long eventId, ChatMessageRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User sender = getCurrentUser();
        User recipient = null;

        if (request.type() == ChatMessageType.PRIVATE_TO_ORGANIZER) {
            recipient = event.getOrganizer();

            if (recipient == null) {
                throw new RuntimeException("Događaj nema organizatora.");
            }
        }

        ChatMessage message = ChatMessage.builder()
                .event(event)
                .sender(sender)
                .recipient(recipient)
                .content(request.content())
                .type(request.type())
                .sentAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        /*
         * WebSocket se ovde koristi kao signal da se chat za događaj promenio.
         * Klijenti posle signala pozivaju GET /api/events/{eventId}/chat,
         * a backend kroz canUserSeeMessage vraća samo poruke koje taj korisnik sme da vidi.
         */
        messagingTemplate.convertAndSend(
                "/topic/events/" + eventId + "/chat/updates",
                Map.of("eventId", eventId)
        );

        return ChatMessageResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long eventId) {
        User currentUser = getCurrentUser();

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        return chatMessageRepository.findByEventIdOrderBySentAtAsc(eventId)
                .stream()
                .filter(message -> canUserSeeMessage(message, currentUser, event))
                .map(ChatMessageResponse::from)
                .toList();
    }

    private boolean canUserSeeMessage(ChatMessage message, User currentUser, Event event) {
        if (currentUser.getRole() == UserRole.ADMIN) {
            return true;
        }

        if (message.getType() == ChatMessageType.PUBLIC) {
            return true;
        }

        if (message.getType() == ChatMessageType.PRIVATE_TO_ORGANIZER) {
            boolean isSender = message.getSender().getId().equals(currentUser.getId());

            boolean isOrganizer = event.getOrganizer() != null &&
                    event.getOrganizer().getId().equals(currentUser.getId());

            return isSender || isOrganizer;
        }

        return false;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}