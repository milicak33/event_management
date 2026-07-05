package com.eventmanagement.service;

import com.eventmanagement.dto.RegistrationResponse;
import com.eventmanagement.entity.*;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.RegistrationRepository;
import com.eventmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /*
     * Osnovna verzija sa optimističkim zaključavanjem preko @Version u Event entitetu.
     */
    @Transactional
    public RegistrationResponse registerOptimistic(Long eventId, Long userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        return registerInternal(event, userId);
    }

    /*
     * Verzija sa pesimističkim zaključavanjem.
     * Ova metoda je korisna za poređenje u master radu.
     */
    @Transactional
    public RegistrationResponse registerPessimistic(Long eventId, Long userId) {
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        return registerInternal(event, userId);
    }

    private RegistrationResponse registerInternal(Event event, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        registrationRepository.findByUserAndEvent(user, event)
                .ifPresent(registration -> {
                    throw new RuntimeException("User is already registered for this event");
                });

        RegistrationStatus status;

        if (event.getAvailableSpots() > 0) {
            event.setAvailableSpots(event.getAvailableSpots() - 1);
            status = RegistrationStatus.REGISTERED;
        } else {
            status = RegistrationStatus.WAITING;
        }

        Registration registration = Registration.builder()
                .user(user)
                .event(event)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();

        Registration saved = registrationRepository.save(registration);

        messagingTemplate.convertAndSend(
                "/topic/events/" + event.getId(),
                "REGISTRATION_CHANGED"
        );

        return RegistrationResponse.from(saved);
    }

    public List<RegistrationResponse> getRegistrationsForEvent(Long eventId) {
        return registrationRepository.findByEventId(eventId)
                .stream()
                .map(RegistrationResponse::from)
                .toList();
    }

    @Transactional
    public RegistrationResponse cancelRegistration(Long eventId, Long userId) {
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Registration registration = registrationRepository.findByUserAndEvent(user, event)
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new RuntimeException("Registration is already cancelled");
        }

        boolean wasRegistered = registration.getStatus() == RegistrationStatus.REGISTERED;

        registration.setStatus(RegistrationStatus.CANCELLED);

        if (wasRegistered) {
            List<Registration> waitingList =
                    registrationRepository.findByEventAndStatusOrderByCreatedAtAsc(
                            event,
                            RegistrationStatus.WAITING
                    );

            if (!waitingList.isEmpty()) {
                Registration firstWaiting = waitingList.get(0);
                firstWaiting.setStatus(RegistrationStatus.REGISTERED);
                registrationRepository.save(firstWaiting);
            } else {
                event.setAvailableSpots(event.getAvailableSpots() + 1);
            }
        }

        Registration saved = registrationRepository.save(registration);

        messagingTemplate.convertAndSend(
                "/topic/events/" + event.getId(),
                "REGISTRATION_CHANGED"
        );

        return RegistrationResponse.from(saved);
    }
}
