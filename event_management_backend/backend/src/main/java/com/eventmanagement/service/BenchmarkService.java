package com.eventmanagement.service;

import com.eventmanagement.dto.BenchmarkResponse;
import com.eventmanagement.dto.CreateUserRequest;
import com.eventmanagement.dto.RegistrationResponse;
import com.eventmanagement.entity.RegistrationStatus;
import com.eventmanagement.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class BenchmarkService {

    private final RegistrationService registrationService;
    private final UserService userService;

    public BenchmarkResponse runBenchmark(Long eventId, String mode, int users) {
        ExecutorService executor =
                Executors.newFixedThreadPool(Math.min(users, 20));

        AtomicInteger registered = new AtomicInteger();
        AtomicInteger waiting = new AtomicInteger();
        AtomicInteger failed = new AtomicInteger();

        long start = System.currentTimeMillis();

        CountDownLatch latch = new CountDownLatch(users);

        for (int i = 0; i < users; i++) {
            int index = i;

            executor.submit(() -> {
                try {
                    var createdUser = userService.createUser(
                            new CreateUserRequest(
                                    "BenchmarkUser_" + index + "_" + UUID.randomUUID(),
                                    "benchmark_" + index + "_" + UUID.randomUUID() + "@example.com",
                                    "123456",
                                    UserRole.PARTICIPANT
                            )
                    );

                    RegistrationResponse response;

                    if ("pessimistic".equalsIgnoreCase(mode)) {
                        response = registrationService.registerPessimistic(
                                eventId,
                                createdUser.id()
                        );
                    } else {
                        response = registrationService.registerOptimistic(
                                eventId,
                                createdUser.id()
                        );
                    }

                    if (response.status() == RegistrationStatus.REGISTERED) {
                        registered.incrementAndGet();
                    } else if (response.status() == RegistrationStatus.WAITING) {
                        waiting.incrementAndGet();
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                    failed.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        executor.shutdown();

        long end = System.currentTimeMillis();

        return new BenchmarkResponse(
                mode,
                users,
                registered.get(),
                waiting.get(),
                failed.get(),
                end - start
        );
    }
}