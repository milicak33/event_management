package com.eventmanagement.benchmark;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/benchmark")
@RequiredArgsConstructor
public class BenchmarkController {

    private final BenchmarkService benchmarkService;

    @PostMapping("/run")
    public BenchmarkResult run(@Valid @RequestBody BenchmarkRequest request) {
        return benchmarkService.run(request);
    }

    @PostMapping("/compare")
    public BenchmarkComparisonResult compare(
            @Valid @RequestBody BenchmarkComparisonRequest request
    ) {
        return benchmarkService.compare(request);
    }
}
