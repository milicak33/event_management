package com.eventmanagement.benchmark;

import com.eventmanagement.entity.Event;
import com.eventmanagement.entity.RegistrationStatus;
import com.eventmanagement.entity.User;
import com.eventmanagement.entity.UserRole;
import com.eventmanagement.repository.EventRepository;
import com.eventmanagement.repository.RegistrationRepository;
import com.eventmanagement.repository.UserRepository;
import com.eventmanagement.service.RegistrationService;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.LockSupport;

@Service
@RequiredArgsConstructor
public class BenchmarkService {

    /*
     * Maksimalan broj pokušaja uključuje i prvi pokušaj.
     *
     * Na primer, vrednost 10 znači:
     * 1 početni pokušaj + najviše 9 ponovnih pokušaja.
     */
    private static final int MAX_OPTIMISTIC_ATTEMPTS = 30;

    /*
     * Nasumična pauza između pokušaja smanjuje verovatnoću
     * da se iste niti ponovo sudare u identičnom trenutku.
     */
    private static final long MIN_RETRY_DELAY_MS = 0;
    private static final long MAX_RETRY_DELAY_MS = 2;

    private final RegistrationService registrationService;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public BenchmarkResult run(BenchmarkRequest request) {
        return runScenario(
                request.mode(),
                request.users(),
                request.capacity(),
                request.shouldCleanupAfterRun()
        );
    }

    public BenchmarkComparisonResult compare(
            BenchmarkComparisonRequest request
    ) {
        BenchmarkResult optimistic = runScenario(
                BenchmarkMode.OPTIMISTIC,
                request.users(),
                request.capacity(),
                request.shouldCleanupAfterRun()
        );

        BenchmarkResult pessimistic = runScenario(
                BenchmarkMode.PESSIMISTIC,
                request.users(),
                request.capacity(),
                request.shouldCleanupAfterRun()
        );

        return new BenchmarkComparisonResult(
                request.users(),
                request.capacity(),
                optimistic,
                pessimistic
        );
    }

    private BenchmarkResult runScenario(
            BenchmarkMode mode,
            int users,
            int capacity,
            boolean cleanupAfterRun
    ) {
        String runId = UUID.randomUUID()
                .toString()
                .replace("-", "");

        Event benchmarkEvent = createBenchmarkEvent(
                mode,
                capacity,
                runId
        );

        List<User> benchmarkUsers = createBenchmarkUsers(
                users,
                runId
        );

        /*
         * readyGate:
         * Čeka da sve niti budu kreirane i spremne.
         *
         * startGate:
         * Omogućava da sve niti počnu približno istovremeno.
         *
         * doneGate:
         * Čeka završetak svih zahteva.
         */
        CountDownLatch readyGate = new CountDownLatch(users);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneGate = new CountDownLatch(users);

        /*
         * Broji ukupan broj optimističkih konflikata.
         *
         * Jedan korisnički zahtev može proizvesti više konflikata
         * ako je bilo potrebno više retry pokušaja.
         */
        AtomicInteger optimisticConflicts = new AtomicInteger();

        /*
         * Čuva vreme odziva svakog pojedinačnog zahteva.
         */
        ConcurrentLinkedQueue<Long> responseTimesNs =
                new ConcurrentLinkedQueue<>();

        long totalStartNs;

        try (
                ExecutorService executor =
                        Executors.newVirtualThreadPerTaskExecutor()
        ) {
            for (User user : benchmarkUsers) {
                executor.submit(() -> {
                    readyGate.countDown();

                    try {
                        /*
                         * Sve niti čekaju dok se startGate ne otvori.
                         */
                        startGate.await();

                        long requestStartNs = System.nanoTime();

                        try {
                            if (mode == BenchmarkMode.PESSIMISTIC) {
                                registrationService.registerPessimistic(
                                        benchmarkEvent.getId(),
                                        user.getId()
                                );
                            } else {
                                registerOptimisticWithRetry(
                                        benchmarkEvent.getId(),
                                        user.getId(),
                                        optimisticConflicts
                                );
                            }

                        } catch (RuntimeException exception) {
                            /*
                             * Ako su iscrpljeni svi retry pokušaji
                             * ili se pojavila neka druga greška,
                             * zahtev ostaje neuspešan.
                             *
                             * Broj neuspešnih zahteva kasnije se računa
                             * na osnovu registracija koje su stvarno
                             * sačuvane u bazi.
                             */

                        } finally {
                            long responseTimeNs =
                                    System.nanoTime() - requestStartNs;

                            responseTimesNs.add(responseTimeNs);
                        }

                    } catch (InterruptedException exception) {
                        Thread.currentThread().interrupt();

                    } finally {
                        doneGate.countDown();
                    }
                });
            }

            awaitOrThrow(
                    readyGate,
                    30,
                    "Benchmark workers were not ready in time"
            );

            totalStartNs = System.nanoTime();

            /*
             * Istovremeno pokretanje svih pripremljenih zahteva.
             */
            startGate.countDown();

            awaitOrThrow(
                    doneGate,
                    120,
                    "Benchmark did not finish in time"
            );
        }

        long totalDurationNs =
                System.nanoTime() - totalStartNs;

        int registered = Math.toIntExact(
                registrationRepository.countByEventIdAndStatus(
                        benchmarkEvent.getId(),
                        RegistrationStatus.REGISTERED
                )
        );

        int waiting = Math.toIntExact(
                registrationRepository.countByEventIdAndStatus(
                        benchmarkEvent.getId(),
                        RegistrationStatus.WAITING
                )
        );

        /*
         * Zahtev se smatra neuspešnim ako za njega nije sačuvana
         * registracija ni sa statusom REGISTERED ni sa statusom WAITING.
         */
        int failed = Math.max(
                0,
                users - registered - waiting
        );

        Event finalEvent = eventRepository
                .findById(benchmarkEvent.getId())
                .orElseThrow(
                        () -> new IllegalStateException(
                                "Benchmark event disappeared"
                        )
                );

        int finalAvailableSpots =
                finalEvent.getAvailableSpots();

        boolean capacityExceeded =
                registered > capacity ||
                        finalAvailableSpots < 0;

        boolean consistencyValid =
                !capacityExceeded &&
                        registered + finalAvailableSpots == capacity;

        ResponseStatistics statistics = calculateStatistics(
                responseTimesNs,
                totalDurationNs,
                users
        );

        Long eventId = benchmarkEvent.getId();

        BenchmarkResult result = new BenchmarkResult(
                mode,
                users,
                capacity,
                registered,
                waiting,
                failed,
                optimisticConflicts.get(),
                statistics.totalDurationMs(),
                statistics.averageResponseMs(),
                statistics.medianResponseMs(),
                statistics.p95ResponseMs(),
                statistics.minResponseMs(),
                statistics.maxResponseMs(),
                statistics.throughputPerSecond(),
                finalAvailableSpots,
                capacityExceeded,
                consistencyValid,
                eventId
        );

        if (cleanupAfterRun) {
            cleanup(eventId, benchmarkUsers);
        }

        return result;
    }

    /**
     * Izvršava optimističku registraciju sa ograničenim
     * brojem ponovnih pokušaja.
     *
     * Svaki poziv registrationService.registerOptimistic(...)
     * prolazi kroz Spring proxy i izvršava se u zasebnoj transakciji.
     */
    private void registerOptimisticWithRetry(
            Long eventId,
            Long userId,
            AtomicInteger optimisticConflicts
    ) {
        for (
                int attempt = 1;
                attempt <= MAX_OPTIMISTIC_ATTEMPTS;
                attempt++
        ) {
            try {
                registrationService.registerOptimistic(
                        eventId,
                        userId
                );

                /*
                 * Registracija je uspešno završena.
                 */
                return;

            } catch (RuntimeException exception) {
                /*
                 * Retry se vrši samo ako je greška nastala
                 * zbog optimističkog zaključavanja.
                 *
                 * Sve druge greške odmah se prosleđuju dalje.
                 */
                if (!isOptimisticConflict(exception)) {
                    throw exception;
                }

                optimisticConflicts.incrementAndGet();

                /*
                 * Ako je iskorišćen poslednji dozvoljeni pokušaj,
                 * zahtev se proglašava neuspešnim.
                 */
                if (attempt == MAX_OPTIMISTIC_ATTEMPTS) {
                    throw exception;
                }

                /*
                 * Nasumična kratka pauza pre sledećeg pokušaja.
                 */
                long delayMs =
                        ThreadLocalRandom.current().nextLong(
                                MIN_RETRY_DELAY_MS,
                                MAX_RETRY_DELAY_MS + 1
                        );

                LockSupport.parkNanos(
                        TimeUnit.MILLISECONDS.toNanos(delayMs)
                );

                /*
                 * Ako je nit prekinuta tokom benchmarka,
                 * prekida se i dalji retry.
                 */
                if (Thread.currentThread().isInterrupted()) {
                    throw new IllegalStateException(
                            "Optimistic registration retry was interrupted",
                            exception
                    );
                }
            }
        }

        /*
         * Ova linija u normalnim okolnostima nije dostižna.
         */
        throw new IllegalStateException(
                "Optimistic registration failed unexpectedly"
        );
    }

    private Event createBenchmarkEvent(
            BenchmarkMode mode,
            int capacity,
            String runId
    ) {
        LocalDateTime now = LocalDateTime.now();

        Event event = Event.builder()
                .title(
                        "BENCHMARK_" +
                                mode.name() +
                                "_" +
                                runId
                )
                .description(
                        "Automatically generated benchmark event"
                )
                .location("BENCHMARK")
                .startTime(now.plusDays(1))
                .endTime(
                        now.plusDays(1).plusHours(2)
                )
                .capacity(capacity)
                .availableSpots(capacity)
                .build();

        return eventRepository.saveAndFlush(event);
    }

    private List<User> createBenchmarkUsers(
            int users,
            String runId
    ) {
        String encodedPassword =
                passwordEncoder.encode("benchmark-password");

        List<User> entities = new ArrayList<>(users);

        for (int index = 0; index < users; index++) {
            entities.add(
                    User.builder()
                            .username(
                                    "benchmark_" +
                                            runId +
                                            "_" +
                                            index
                            )
                            .email(
                                    "benchmark_" +
                                            runId +
                                            "_" +
                                            index +
                                            "@example.test"
                            )
                            .password(encodedPassword)
                            .role(UserRole.PARTICIPANT)
                            .build()
            );
        }

        return userRepository.saveAllAndFlush(entities);
    }

    private ResponseStatistics calculateStatistics(
            ConcurrentLinkedQueue<Long> responseTimesNs,
            long totalDurationNs,
            int requestedUsers
    ) {
        List<Long> values =
                new ArrayList<>(responseTimesNs);

        Collections.sort(values);

        if (values.isEmpty()) {
            return new ResponseStatistics(
                    nanosToMillis(totalDurationNs),
                    0.0,
                    0.0,
                    0.0,
                    0,
                    0,
                    0.0
            );
        }

        double averageNs = values.stream()
                .mapToLong(Long::longValue)
                .average()
                .orElse(0.0);

        double medianNs =
                percentile(values, 0.50);

        double p95Ns =
                percentile(values, 0.95);

        double durationSeconds =
                totalDurationNs / 1_000_000_000.0;

        return new ResponseStatistics(
                nanosToMillis(totalDurationNs),
                averageNs / 1_000_000.0,
                medianNs / 1_000_000.0,
                p95Ns / 1_000_000.0,
                nanosToMillis(values.getFirst()),
                nanosToMillis(values.getLast()),
                durationSeconds == 0.0
                        ? 0.0
                        : requestedUsers / durationSeconds
        );
    }

    private double percentile(
            List<Long> sortedValues,
            double percentile
    ) {
        if (sortedValues.size() == 1) {
            return sortedValues.getFirst();
        }

        double position =
                percentile * (sortedValues.size() - 1);

        int lowerIndex =
                (int) Math.floor(position);

        int upperIndex =
                (int) Math.ceil(position);

        if (lowerIndex == upperIndex) {
            return sortedValues.get(lowerIndex);
        }

        double fraction =
                position - lowerIndex;

        return sortedValues.get(lowerIndex)
                + fraction * (
                sortedValues.get(upperIndex)
                        - sortedValues.get(lowerIndex)
        );
    }

    /**
     * Proverava da li izuzetak ili neki od njegovih uzroka
     * predstavlja konflikt optimističkog zaključavanja.
     */
    private boolean isOptimisticConflict(
            Throwable throwable
    ) {
        Throwable current = throwable;

        while (current != null) {
            if (
                    current
                            instanceof ObjectOptimisticLockingFailureException ||
                            current
                                    instanceof OptimisticLockException
            ) {
                return true;
            }

            String simpleName = current
                    .getClass()
                    .getSimpleName()
                    .toLowerCase(Locale.ROOT);

            if (
                    simpleName.contains("optimisticlock") ||
                            simpleName.contains("staleobjectstate")
            ) {
                return true;
            }

            current = current.getCause();
        }

        return false;
    }

    private void cleanup(
            Long eventId,
            List<User> benchmarkUsers
    ) {
        registrationRepository.deleteByEventId(eventId);
        eventRepository.deleteById(eventId);
        userRepository.deleteAllInBatch(benchmarkUsers);
    }

    private void awaitOrThrow(
            CountDownLatch latch,
            long timeoutSeconds,
            String errorMessage
    ) {
        try {
            boolean completed =
                    latch.await(
                            timeoutSeconds,
                            TimeUnit.SECONDS
                    );

            if (!completed) {
                throw new IllegalStateException(errorMessage);
            }

        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();

            throw new IllegalStateException(
                    "Benchmark was interrupted",
                    exception
            );
        }
    }

    private long nanosToMillis(long nanos) {
        return TimeUnit.NANOSECONDS.toMillis(nanos);
    }

    private record ResponseStatistics(
            long totalDurationMs,
            double averageResponseMs,
            double medianResponseMs,
            double p95ResponseMs,
            long minResponseMs,
            long maxResponseMs,
            double throughputPerSecond
    ) {
    }
}