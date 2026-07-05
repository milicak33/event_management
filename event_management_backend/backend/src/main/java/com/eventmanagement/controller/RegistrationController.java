package com.eventmanagement.controller;

import com.eventmanagement.dto.RegistrationResponse;
import com.eventmanagement.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/registrations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/optimistic")
    public RegistrationResponse registerOptimistic(
            @PathVariable Long eventId,
            @RequestParam Long userId
    ) {
        return registrationService.registerOptimistic(eventId, userId);
    }

    @PostMapping("/pessimistic")
    public RegistrationResponse registerPessimistic(
            @PathVariable Long eventId,
            @RequestParam Long userId
    ) {
        return registrationService.registerPessimistic(eventId, userId);
    }

    @GetMapping
    public List<RegistrationResponse> getRegistrations(@PathVariable Long eventId) {
        return registrationService.getRegistrationsForEvent(eventId);
    }

    @DeleteMapping
    public RegistrationResponse cancelRegistration(
            @PathVariable Long eventId,
            @RequestParam Long userId
    ) {
        return registrationService.cancelRegistration(eventId, userId);
    }
}
