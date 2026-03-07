package com.example.dsa.recommendation;

import com.example.dsa.challenge.Problem;
import com.example.dsa.entity.TopicStats;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Pure computation class — no Spring repos injected here.
 * All data is passed in; this class only does math and ranking.
 */
@Component
public class RecommendationEngine {

    // Mastery targets per topic (how many problems needed to be "expert")
    private static final Map<String, Integer> TOPIC_TARGETS = Map.ofEntries(
            Map.entry("arrays", 40),
            Map.entry("strings", 30),
            Map.entry("linked list", 25),
            Map.entry("trees", 35),
            Map.entry("graphs", 30),
            Map.entry("dynamic programming", 40),
            Map.entry("backtracking", 20),
            Map.entry("sorting", 20),
            Map.entry("binary search", 20),
            Map.entry("stack", 20),
            Map.entry("queue", 15),
            Map.entry("heap", 20),
            Map.entry("greedy", 25),
            Map.entry("math", 20),
            Map.entry("bit manipulation", 15));

    public static final int DEFAULT_TARGET = 25;

    /** Compute 0.0–1.0 skill score for a topic */
    public double skillScore(String topic, int solvedCount) {
        int target = TOPIC_TARGETS.getOrDefault(topic.toLowerCase(), DEFAULT_TARGET);
        return Math.min(1.0, (double) solvedCount / target);
    }

    /** Determine recommended difficulty based on easy/medium/hard distribution */
    public String recommendedDifficulty(int easyCount, int mediumCount, int hardCount) {
        if (easyCount < 30)
            return "Easy";
        if (easyCount >= 30 && mediumCount < 60)
            return "Medium";
        if (mediumCount >= 60 && hardCount < 20)
            return "Hard";
        return "Medium"; // mix — default to medium for balance
    }

    /** Determine difficulty for a specific topic skill score */
    public String difficultyForSkill(double skill) {
        if (skill < 0.30)
            return "Easy";
        if (skill < 0.70)
            return "Medium";
        return "Hard";
    }

    /**
     * Score and rank problems.
     * Higher score → more recommended.
     */
    public List<ScoredProblem> rankProblems(
            List<Problem> candidates,
            List<TopicStats> userTopics,
            String globalRecommendedDiff,
            Set<String> usedPlatforms) {

        // Build skill map
        Map<String, Double> skillMap = new HashMap<>();
        for (TopicStats ts : userTopics) {
            skillMap.put(ts.getTopic().toLowerCase(), skillScore(ts.getTopic(), ts.getSolvedCount()));
        }

        List<ScoredProblem> scored = new ArrayList<>();
        Random rng = new Random();

        for (Problem p : candidates) {
            double score = 0;
            String topic = p.getTopic() != null ? p.getTopic().toLowerCase() : "";
            double topicSkill = skillMap.getOrDefault(topic, 0.0);

            // +5 for weak topic (skill score < 0.4)
            if (topicSkill < 0.40)
                score += 5.0 * (1.0 - topicSkill);

            // +3 for difficulty match
            String expected = difficultyForSkill(topicSkill);
            if (p.getDifficulty() != null && p.getDifficulty().equalsIgnoreCase(expected))
                score += 3;

            // +1 for platform diversity
            String plat = p.getPlatform() != null ? p.getPlatform().toLowerCase() : "";
            if (!usedPlatforms.contains(plat))
                score += 1;

            // Small random factor for variety (0–1)
            score += rng.nextDouble();

            scored.add(new ScoredProblem(p, score, buildReason(p, topicSkill, globalRecommendedDiff)));
        }

        scored.sort((a, b) -> Double.compare(b.score(), a.score()));
        return scored;
    }

    /** Identify weakest topics from user's topic_stats */
    public List<WeakTopicResult> weakTopics(List<TopicStats> userTopics, int limit) {
        return userTopics.stream()
                .map(ts -> {
                    double skill = skillScore(ts.getTopic(), ts.getSolvedCount());
                    int target = TOPIC_TARGETS.getOrDefault(ts.getTopic().toLowerCase(), DEFAULT_TARGET);
                    return new WeakTopicResult(ts.getTopic(), ts.getSolvedCount(), target, skill);
                })
                .sorted(Comparator.comparingDouble(WeakTopicResult::skillScore))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private String buildReason(Problem p, double skillScore, String globalDiff) {
        String topic = p.getTopic() != null ? p.getTopic() : "this topic";
        if (skillScore < 0.20)
            return topic + " is your weakest area — needs urgent practice";
        if (skillScore < 0.40)
            return topic + " skill is low (" + pct(skillScore) + "% mastery) — keep building";
        if (skillScore < 0.60)
            return "You're progressing in " + topic + " — this " + p.getDifficulty() + " will push you further";
        if (skillScore < 0.80)
            return "You're solid in " + topic + " — tackle this " + p.getDifficulty() + " to reach mastery";
        return "Challenge yourself: " + topic + " mastery problem";
    }

    private String pct(double skill) {
        return String.valueOf((int) (skill * 100));
    }

    // ── inner result types ──

    public record ScoredProblem(Problem problem, double score, String reason) {
    }

    public record WeakTopicResult(String topic, int solved, int target, double skillScore) {
        public String reason() {
            if (skillScore < 0.20)
                return "Critical gap — only " + solved + "/" + target + " solved";
            if (skillScore < 0.50)
                return "Needs work — " + solved + "/" + target + " solved";
            return "Developing — " + solved + "/" + target + " solved";
        }
    }
}
