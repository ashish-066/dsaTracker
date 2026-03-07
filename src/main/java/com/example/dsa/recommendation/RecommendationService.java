package com.example.dsa.recommendation;

import com.example.dsa.challenge.Problem;
import com.example.dsa.challenge.ProblemRepository;
import com.example.dsa.entity.TopicStats;
import com.example.dsa.entity.UserStats;
import com.example.dsa.repository.TopicStatsRepository;
import com.example.dsa.repository.UserStatsRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final RecommendationEngine engine;
    private final ProblemRepository problemRepo;
    private final TopicStatsRepository topicStatsRepo;
    private final UserStatsRepository userStatsRepo;

    public RecommendationService(RecommendationEngine engine,
            ProblemRepository problemRepo,
            TopicStatsRepository topicStatsRepo,
            UserStatsRepository userStatsRepo) {
        this.engine = engine;
        this.problemRepo = problemRepo;
        this.topicStatsRepo = topicStatsRepo;
        this.userStatsRepo = userStatsRepo;
    }

    /** Daily recommendations — skill-scored and ranked */
    public Map<String, Object> dailyRecommendations(String userId, int limit) {
        List<TopicStats> userTopics = topicStatsRepo.findByUserId(userId);
        List<UserStats> allStats = userStatsRepo.findByUserId(userId);

        // Aggregate easy/medium/hard across all platforms
        int easy = allStats.stream().mapToInt(s -> s.getEasyCount() != null ? s.getEasyCount() : 0).sum();
        int medium = allStats.stream().mapToInt(s -> s.getMediumCount() != null ? s.getMediumCount() : 0).sum();
        int hard = allStats.stream().mapToInt(s -> s.getHardCount() != null ? s.getHardCount() : 0).sum();

        String globalDiff = engine.recommendedDifficulty(easy, medium, hard);

        // Identify weak topics (bottom 3 by skill score)
        List<RecommendationEngine.WeakTopicResult> weak = engine.weakTopics(userTopics, 3);
        Set<String> weakTopicNames = weak.stream()
                .map(w -> w.topic().toLowerCase())
                .collect(Collectors.toSet());

        // Fetch candidate problems — prioritise weak topics, also get some of global
        // diff
        List<Problem> candidates = new ArrayList<>();
        for (String topic : weakTopicNames) {
            candidates.addAll(problemRepo.findByTopicIgnoreCaseAndDifficultyIgnoreCase(topic,
                    engine.difficultyForSkill(engine.skillScore(topic,
                            userTopics.stream().filter(t -> t.getTopic().equalsIgnoreCase(topic))
                                    .mapToInt(TopicStats::getSolvedCount).sum()))));
        }
        // Add more general candidates
        candidates.addAll(problemRepo.findRandomByDifficulty(globalDiff));

        // Deduplicate
        Map<Long, Problem> unique = new LinkedHashMap<>();
        candidates.forEach(p -> unique.putIfAbsent(p.getId(), p));

        // Rank
        Set<String> usedPlatforms = new HashSet<>();
        List<RecommendationEngine.ScoredProblem> ranked = engine.rankProblems(new ArrayList<>(unique.values()),
                userTopics, globalDiff, usedPlatforms);

        // Take top N — ensure platform diversity
        List<RecommendationDto> recommendations = new ArrayList<>();
        Set<Long> addedIds = new HashSet<>();
        for (RecommendationEngine.ScoredProblem sp : ranked) {
            if (recommendations.size() >= limit)
                break;
            if (addedIds.contains(sp.problem().getId()))
                continue;
            addedIds.add(sp.problem().getId());
            usedPlatforms.add(sp.problem().getPlatform() != null ? sp.problem().getPlatform().toLowerCase() : "");
            recommendations.add(toDto(sp));
        }

        // Build skill snapshot
        List<Map<String, Object>> skillSnapshot = userTopics.stream().map(ts -> {
            double sk = engine.skillScore(ts.getTopic(), ts.getSolvedCount());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("topic", ts.getTopic());
            m.put("solved", ts.getSolvedCount());
            m.put("target", RecommendationEngine.DEFAULT_TARGET);
            m.put("skillScore", Math.round(sk * 100.0) / 100.0);
            m.put("pct", (int) (sk * 100));
            return m;
        }).sorted(Comparator.comparingDouble(m -> (double) m.get("skillScore")))
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("recommendations", recommendations);
        result.put("easyCount", easy);
        result.put("mediumCount", medium);
        result.put("hardCount", hard);
        result.put("globalRecommendedDifficulty", globalDiff);
        result.put("weakTopics", weak.stream().map(w -> Map.of(
                "topic", w.topic(), "solved", w.solved(), "target", w.target(),
                "skillScore", Math.round(w.skillScore() * 100.0) / 100.0,
                "pct", (int) (w.skillScore() * 100), "reason", w.reason())).toList());
        result.put("skillSnapshot", skillSnapshot);
        return result;
    }

    /** Weakness analysis only */
    public Map<String, Object> weakTopics(String userId) {
        List<TopicStats> userTopics = topicStatsRepo.findByUserId(userId);
        List<RecommendationEngine.WeakTopicResult> weak = engine.weakTopics(userTopics, 5);
        return Map.of("weakTopics", weak.stream().map(w -> Map.of(
                "topic", w.topic(), "solved", w.solved(), "target", w.target(),
                "skillScore", Math.round(w.skillScore() * 100.0) / 100.0,
                "pct", (int) (w.skillScore() * 100), "reason", w.reason())).toList());
    }

    /** Difficulty progression advice */
    public Map<String, Object> difficultyProgress(String userId) {
        List<UserStats> all = userStatsRepo.findByUserId(userId);
        int easy = all.stream().mapToInt(s -> s.getEasyCount() != null ? s.getEasyCount() : 0).sum();
        int medium = all.stream().mapToInt(s -> s.getMediumCount() != null ? s.getMediumCount() : 0).sum();
        int hard = all.stream().mapToInt(s -> s.getHardCount() != null ? s.getHardCount() : 0).sum();
        String rec = engine.recommendedDifficulty(easy, medium, hard);
        String reason = buildDiffReason(easy, medium, hard, rec);
        return Map.of("recommendedDifficulty", rec, "reason", reason,
                "easyCount", easy, "mediumCount", medium, "hardCount", hard,
                "nextMilestone", nextMilestone(easy, medium, hard));
    }

    private String buildDiffReason(int easy, int medium, int hard, String rec) {
        if (rec.equals("Easy"))
            return "You've solved " + easy + " easy problems. Keep building your foundation.";
        if (rec.equals("Medium"))
            return "You've solved " + easy + " easy problems. Time to push into medium territory.";
        return "Excellent! " + easy + " easy and " + medium + " medium solved. Ready for hard problems.";
    }

    private String nextMilestone(int easy, int medium, int hard) {
        if (easy < 30)
            return "Solve " + (30 - easy) + " more easy problems to unlock medium recommendations";
        if (medium < 60)
            return "Solve " + (60 - medium) + " more medium problems to unlock hard recommendations";
        if (hard < 20)
            return "Solve " + (20 - hard) + " more hard problems to reach expert level";
        return "You're at expert level — keep grinding! 🔥";
    }

    private RecommendationDto toDto(RecommendationEngine.ScoredProblem sp) {
        RecommendationDto d = new RecommendationDto();
        Problem p = sp.problem();
        d.setProblemId(p.getId());
        d.setTitleSlug(p.getTitleSlug());
        d.setTitle(p.getTitle());
        d.setPlatform(p.getPlatform());
        d.setDifficulty(p.getDifficulty());
        d.setTopic(p.getTopic());
        d.setProblemUrl(p.getProblemUrl());
        d.setReason(sp.reason());
        d.setScore(Math.round(sp.score() * 100.0) / 100.0);
        return d;
    }
}
