package com.eventmanagement.dto;

public record BenchmarkResponse(
        String mode,
        int requestedUsers,
        int registered,
        int waiting,
        int failed,
        long durationMs
) {}
