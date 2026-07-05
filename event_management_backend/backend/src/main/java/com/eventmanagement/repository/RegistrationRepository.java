package com.eventmanagement.repository;

import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.Registration;
import com.eventmanagement.entity.RegistrationStatus;
import com.eventmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    Optional<Registration> findByUserAndEvent(User user, Event event);
    List<Registration> findByEventId(Long eventId);
    List<Registration> findByEventAndStatusOrderByCreatedAtAsc(Event event, RegistrationStatus status);
}
