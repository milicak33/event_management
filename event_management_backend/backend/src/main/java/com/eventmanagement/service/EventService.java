package com.eventmanagement.service;

import com.eventmanagement.dto.CreateEventRequest;
import com.eventmanagement.dto.EventResponse;
import com.eventmanagement.entity.Event;
import com.eventmanagement.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public EventResponse createEvent(CreateEventRequest request) {
        Event event = Event.builder()
                .title(request.title())
                .description(request.description())
                .location(request.location())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .capacity(request.capacity())
                .availableSpots(request.capacity())
                .build();

        return EventResponse.from(eventRepository.save(event));
    }

    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll()
                .stream()
                .map(EventResponse::from)
                .toList();
    }

    public EventResponse getEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return EventResponse.from(event);
    }

    @Transactional
    public EventResponse updateEvent(Long id, CreateEventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

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

        eventRepository.delete(event);
    }
}
