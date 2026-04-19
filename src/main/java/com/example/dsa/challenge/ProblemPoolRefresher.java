package com.example.dsa.challenge;

import com.example.dsa.recommendation.ProblemFetchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Grows the {@code problems} pool in the background.
 *
 * <p>Runs every 12 hours. For each {@code (topic, difficulty)} combo we care
 * about, asks {@link ProblemFetchService} to fetch a fresh batch from
 * LeetCode + Codeforces, and upserts any we haven't seen before
 * (dedup via the existing unique constraint on {@code title_slug}).
 *
 * <p>The static seed in {@link ProblemSeeder} guarantees a minimum floor on
 * first boot; this refresher guarantees the pool keeps growing on its own
 * so contests stop feeling repetitive as usage accumulates.
 *
 * <p>If either platform's API is down or rate-limiting us during a refresh,
 * we log and move on — a single bad run never crashes the app, and the next
 * scheduled tick retries. No retry-storm, no data corruption.
 */
@Component
public class ProblemPoolRefresher {

    private static final Logger log = LoggerFactory.getLogger(ProblemPoolRefresher.class);

    /** Run cadence: twice a day is plenty — the pool grows fast enough without
     *  hammering LeetCode or Codeforces, which both have per-IP rate limits. */
    private static final long HALF_DAY_MS = 12L * 60 * 60 * 1000;

    /** Topics worth fetching. Matches the topic set the rec engine + UI use. */
    private static final List<String> TOPICS = List.of(
        "arrays", "strings", "linked-list", "trees", "graphs", "dp",
        "heap", "binary-search", "backtracking", "math", "greedy",
        "sliding-window", "two-pointers", "sorting", "bit-manipulation"
    );
    private static final List<String> DIFFICULTIES = List.of("Easy", "Medium", "Hard");

    /** Always fetch from both. LeetCode-only or CF-only contests are rare. */
    private static final List<String> PLATFORMS = List.of("leetcode", "codeforces");

    private final ProblemFetchService fetchService;
    private final ProblemRepository problemRepo;

    public ProblemPoolRefresher(ProblemFetchService fetchService, ProblemRepository problemRepo) {
        this.fetchService = fetchService;
        this.problemRepo = problemRepo;
    }

    /**
     * Kick off 5 minutes after boot so we never block startup, then every 12h.
     * Wrapping in @Transactional so all the upserts for one run share one
     * transaction — failures roll back cleanly.
     */
    @Scheduled(initialDelay = 5L * 60 * 1000, fixedDelay = HALF_DAY_MS)
    @Transactional
    public void refresh() {
        int inserted = 0;
        int combosAttempted = 0;
        int combosFailed = 0;

        for (String topic : TOPICS) {
            for (String difficulty : DIFFICULTIES) {
                combosAttempted++;
                try {
                    // Pass an empty dbProblems list so mergedForPlatforms purely
                    // returns what the live APIs hand back (in addition to any
                    // it already cached in memory from the rec engine).
                    List<com.example.dsa.challenge.Problem> live =
                            fetchService.mergedForPlatforms(topic, difficulty, List.of(), PLATFORMS);

                    List<Problem> toInsert = new ArrayList<>();
                    for (Problem p : live) {
                        if (p.getTitleSlug() == null || p.getTitleSlug().isBlank()) continue;
                        if (problemRepo.existsByTitleSlug(p.getTitleSlug())) continue;
                        // Normalise difficulty casing — the rest of the app
                        // compares via LOWER(), but consistency is cheaper to
                        // enforce on write than on read.
                        p.setDifficulty(capitalize(p.getDifficulty()));
                        toInsert.add(p);
                    }
                    if (!toInsert.isEmpty()) {
                        problemRepo.saveAll(toInsert);
                        inserted += toInsert.size();
                    }
                } catch (Exception e) {
                    combosFailed++;
                    log.warn("[pool-refresh] {}/{} failed: {}", topic, difficulty, e.toString());
                }
            }
        }

        log.info("[pool-refresh] +{} new problems across {}/{} combos (pool now {})",
                inserted, combosAttempted - combosFailed, combosAttempted,
                problemRepo.count());
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    // Map exposed for unit-test authoring later — isn't called internally.
    @SuppressWarnings("unused")
    static Map<String, Object> config() {
        return Map.of("topics", TOPICS, "difficulties", DIFFICULTIES, "platforms", PLATFORMS);
    }
}
