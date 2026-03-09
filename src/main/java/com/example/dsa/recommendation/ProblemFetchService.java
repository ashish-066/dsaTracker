package com.example.dsa.recommendation;

import com.example.dsa.challenge.Problem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Fetches problems dynamically from LeetCode's public GraphQL API.
 * Results are cached in-memory for 6 hours so we never hammer the API.
 *
 * Cache key: "problems::{topic}::{difficulty}"
 */
@Service
public class ProblemFetchService {

    private static final String LEETCODE_API = "https://leetcode.com/graphql";
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    // Tag slug mappings — LeetCode uses specific tag slugs
    private static final Map<String, String> TOPIC_TAG_SLUGS = Map.ofEntries(
            Map.entry("arrays", "array"),
            Map.entry("strings", "string"),
            Map.entry("linked list", "linked-list"),
            Map.entry("trees", "tree"),
            Map.entry("graphs", "graph"),
            Map.entry("dynamic programming", "dynamic-programming"),
            Map.entry("backtracking", "backtracking"),
            Map.entry("sorting", "sorting"),
            Map.entry("binary search", "binary-search"),
            Map.entry("stack", "stack"),
            Map.entry("queue", "queue"),
            Map.entry("heap", "heap-priority-queue"),
            Map.entry("greedy", "greedy"),
            Map.entry("math", "math"),
            Map.entry("bit manipulation", "bit-manipulation"));

    /**
     * Fetch up to 10 problems for a topic + difficulty from LeetCode.
     * Spring caches the result for 6 hours (configured in CacheConfig).
     */
    @Cacheable(value = "problems", key = "#topic + '::' + #difficulty")
    public List<Problem> fetchProblems(String topic, String difficulty) {
        String tagSlug = TOPIC_TAG_SLUGS.getOrDefault(topic.toLowerCase(), topic.toLowerCase().replace(" ", "-"));
        String lcDiff = difficulty.toUpperCase(); // LeetCode uses EASY / MEDIUM / HARD

        String query = """
                {
                  "query": "query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) { problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) { questions: data { title titleSlug difficulty } } }",
                  "variables": {
                    "categorySlug": "",
                    "skip": 0,
                    "limit": 10,
                    "filters": { "difficulty": "%s", "tags": ["%s"] }
                  }
                }
                """
                .formatted(lcDiff, tagSlug);

        try {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(LEETCODE_API))
                    .POST(HttpRequest.BodyPublishers.ofString(query))
                    .header("Content-Type", "application/json")
                    .header("Referer", "https://leetcode.com")
                    .build();

            HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200)
                return List.of();

            JsonNode root = MAPPER.readTree(resp.body());
            JsonNode questions = root.path("data").path("problemsetQuestionList").path("questions");
            if (!questions.isArray())
                return List.of();

            List<Problem> problems = new ArrayList<>();
            for (JsonNode q : questions) {
                Problem p = new Problem();
                p.setTitle(q.path("title").asText());
                p.setTitleSlug(q.path("titleSlug").asText());
                p.setDifficulty(capitalize(q.path("difficulty").asText()));
                p.setPlatform("LeetCode");
                p.setTopic(topic);
                p.setProblemUrl("https://leetcode.com/problems/" + q.path("titleSlug").asText() + "/");
                problems.add(p);
            }
            return problems;
        } catch (Exception e) {
            return List.of(); // graceful degradation — fallback to DB problems
        }
    }

    /**
     * Merge live problems from LeetCode with locally seeded problems, de-duped by
     * titleSlug
     */
    public List<Problem> mergedProblems(String topic, String difficulty, List<Problem> dbProblems) {
        List<Problem> live = fetchProblems(topic, difficulty);

        Map<String, Problem> merged = new LinkedHashMap<>();
        // DB problems first (they have IDs, platform URLs, etc.)
        dbProblems.forEach(p -> merged.put(p.getTitleSlug(), p));
        // Live problems fill gaps
        live.stream()
                .filter(p -> !merged.containsKey(p.getTitleSlug()))
                .forEach(p -> merged.put(p.getTitleSlug(), p));

        return new ArrayList<>(merged.values());
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty())
            return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }
}
