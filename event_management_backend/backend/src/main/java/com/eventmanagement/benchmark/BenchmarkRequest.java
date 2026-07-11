package com.eventmanagement.benchmark;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BenchmarkRequest(
        @NotNull BenchmarkMode mode,
        @Min(1) @Max(2000) int users,
        @Min(1) @Max(10000) int capacity,
        Boolean cleanupAfterRun
) {
    public boolean shouldCleanupAfterRun() {
        return cleanupAfterRun == null || cleanupAfterRun;
    }
}
