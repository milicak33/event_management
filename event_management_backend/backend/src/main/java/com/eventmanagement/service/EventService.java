package com.eventmanagement.service;

import com.eventmanagement.dto.CreateEventRequest;
import com.eventmanagement.dto.EventResponse;
import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.User;
import com.eventmanagement.entity.UserRole;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() != UserRole.ADMIN &&
                currentUser.getRole() != UserRole.ORGANIZER) {
            throw new RuntimeException("Nemate pravo da kreirate događaj.");
        }

        Event event = Event.builder()
                .title(request.title())
                .description(request.description())
                .location(request.location())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .capacity(request.capacity())
                .availableSpots(request.capacity())
                .organizer(currentUser)
                .build();

        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(EventResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventResponse getEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        return EventResponse.from(event);
    }

    @Transactional
    public EventResponse updateEvent(Long id, CreateEventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User currentUser = getCurrentUser();
        validateEventOwnership(event, currentUser);

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setLocation(request.location());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());

        int oldCapacity = event.getCapacity();
        int newCapacity = request.capacity();

        event.setCapacity(newCapacity);

        int occupiedSpots = oldCapacity - event.getAvailableSpots();
        event.setAvailableSpots(Math.max(newCapacity - occupiedSpots, 0));

        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User currentUser = getCurrentUser();
        validateEventOwnership(event, currentUser);

        eventRepository.delete(event);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void validateEventOwnership(Event event, User currentUser) {
        if (currentUser.getRole() == UserRole.ADMIN) {
            return;
        }

        if (currentUser.getRole() != UserRole.ORGANIZER) {
            throw new RuntimeException("Nemate pravo da upravljate događajem.");
        }

        if (event.getOrganizer() == null ||
                !event.getOrganizer().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Možete menjati samo događaje koje ste vi kreirali.");
        }
    }
}