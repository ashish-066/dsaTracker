package com.example.dsa.recommendation;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/recommendations")
public class RecommendationController {

    private final RecommendationService service;

    public RecommendationController(RecommendationService service) {
        this.service = service;
    }

    /**
     * GET /recommendations/daily
     * Returns 5 personalised problems, skill snapshot, weak topics, and difficulty
     * level.
     */
    @GetMapping("/daily")
    public ResponseEntity<?> daily(Authentication auth,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(service.dailyRecommendations(auth.getName(), Math.min(limit, 10)));
    }

    /**
     * GET /recommendations/weak-topics
     * Returns the 5 weakest topics for this user.
     */
    @GetMapping("/weak-topics")
    public ResponseEntity<?> weakTopics(Authentication auth) {
        return ResponseEntity.ok(service.weakTopics(auth.getName()));
    }

    /**
     * GET /recommendations/difficulty-progress
     * Returns difficulty progression suggestion with reason and next milestone.
     */
    @GetMapping("/difficulty-progress")
    public ResponseEntity<?> difficultyProgress(Authentication auth) {
        return ResponseEntity.ok(service.difficultyProgress(auth.getName()));
    }
}
