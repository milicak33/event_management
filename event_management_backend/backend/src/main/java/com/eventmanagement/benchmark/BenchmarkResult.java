package com.eventmanagement.benchmark;

public record BenchmarkResult(
        BenchmarkMode mode,
        int requestedUsers,
        int eventCapacity,
        int registered,
        int waiting,
        int failed,
        int optimisticConflicts,
        long totalDurationMs,
        double averageResponseMs,
        double medianResponseMs,
        double p95ResponseMs,
        long minResponseMs,
        long maxResponseMs,
        double throughputPerSecond,
        int finalAvailableSpots,
        boolean capacityExceeded,
        boolean consistencyValid,
        Long benchmarkEventId
) {
}
