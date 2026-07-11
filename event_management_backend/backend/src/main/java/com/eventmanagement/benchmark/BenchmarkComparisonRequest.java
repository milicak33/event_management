package com.eventmanagement.benchmark;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record BenchmarkComparisonRequest(
        @Min(1) @Max(2000) int users,
        @Min(1) @Max(10000) int capacity,
        Boolean cleanupAfterRun
) {
    public boolean shouldCleanupAfterRun() {
        return cleanupAfterRun == null || cleanupAfterRun;
    }
}
