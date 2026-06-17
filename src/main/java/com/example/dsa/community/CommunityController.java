package com.example.dsa.community;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/community")
public class CommunityController {

    private final WeeklyChallengeStore store;
    private final PostRepository postRepo;

    public CommunityController(WeeklyChallengeStore store, PostRepository postRepo) {
        this.store = store;
        this.postRepo = postRepo;
    }

    /** GET /api/community/weekly-challenge */
    @GetMapping("/weekly-challenge")
    public ResponseEntity<?> weeklyChallenge() {
        return ResponseEntity.ok(store.current());
    }

    /** GET /api/community/stats — postsToday + top 3 contributors */
    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        LocalDateTime startOfDay = LocalDate.now().atTime(LocalTime.MIDNIGHT);
        long postsToday = postRepo.countByCreatedAtAfter(startOfDay);

        List<Map<String, Object>> contributors = postRepo
            .findTopContributors(PageRequest.of(0, 3))
            .stream()
            .map(row -> Map.<String, Object>of(
                "name",      row[0],
                "postCount", row[1]
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "postsToday",       postsToday,
            "topContributors",  contributors
        ));
    }
}
