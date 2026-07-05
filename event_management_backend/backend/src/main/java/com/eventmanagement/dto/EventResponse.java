package com.eventmanagement.dto;

import com.eventmanagement.entity.Event;

import java.time.LocalDateTime;

public record EventResponse(
        Long id,
        String title,
        String description,
        String location,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer capacity,
        Integer availableSpots,
        Long version,
        Long organizerId,
        String organizerUsername
) {

    public static EventResponse from(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getLocation(),
                event.getStartTime(),
                event.getEndTime(),
                event.getCapacity(),
                event.getAvailableSpots(),
                event.getVersion(),
                event.getOrganizer() != null ? event.getOrganizer().getId() : null,
                event.getOrganizer() != null ? event.getOrganizer().getUsername() : null
        );
    }
}