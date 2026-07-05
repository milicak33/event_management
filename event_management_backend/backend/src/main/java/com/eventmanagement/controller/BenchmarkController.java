package com.eventmanagement.controller;

import com.eventmanagement.dto.BenchmarkResponse;
import com.eventmanagement.service.BenchmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/benchmark")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BenchmarkController {

    private final BenchmarkService benchmarkService;

    @PostMapping("/events/{eventId}")
    public BenchmarkResponse runBenchmark(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "optimistic") String mode,
            @RequestParam(defaultValue = "50") int users
    ) {
        return benchmarkService.runBenchmark(eventId, mode, users);
    }
}