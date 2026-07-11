package com.eventmanagement.benchmark;

public record BenchmarkComparisonResult(
        int requestedUsers,
        int eventCapacity,
        BenchmarkResult optimistic,
        BenchmarkResult pessimistic
) {
}
