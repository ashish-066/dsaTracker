package com.example.dsa.challenge;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/challenges")
public class ChallengeController {

    private final ChallengeService service;
    private final ProblemRepository problemRepo;

    public ChallengeController(ChallengeService service, ProblemRepository problemRepo) {
        this.service = service;
        this.problemRepo = problemRepo;
    }

    /** Create a new challenge. Challenger = authenticated user. */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateChallengeRequest req, Authentication auth) {
        try {
            ChallengeResponse r = service.createChallenge(auth.getName(), req);
            return ResponseEntity.ok(r);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Get full details of a specific challenge. */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(service.getChallenge(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Opponent accepts the challenge. */
    @PostMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(service.acceptChallenge(id, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Opponent declines the challenge. */
    @PostMapping("/{id}/decline")
    public ResponseEntity<?> decline(@PathVariable Long id, Authentication auth) {
        try {
            service.declineChallenge(id, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Challenge declined"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Fetch live leaderboard progress. */
    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<?> leaderboard(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.leaderboard(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Manually finish a challenge. */
    @PostMapping("/{id}/finish")
    public ResponseEntity<?> finish(@PathVariable Long id, Authentication auth) {
        try {
            return ResponseEntity.ok(service.finish(id, auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** All challenges for the current user. */
    @GetMapping("/mine")
    public ResponseEntity<List<ChallengeResponse>> mine(Authentication auth) {
        return ResponseEntity.ok(service.myChallenges(auth.getName()));
    }

    /** Pending invitations received by current user. */
    @GetMapping("/invitations")
    public ResponseEntity<List<ChallengeResponse>> invitations(Authentication auth) {
        return ResponseEntity.ok(service.pendingInvitations(auth.getName()));
    }

    /** Record a solve (internal - can be called by sync service). */
    @PostMapping("/{id}/solve")
    public ResponseEntity<?> recordSolve(@PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        service.recordSolve(id, auth.getName(), body.get("titleSlug"));
        return ResponseEntity.ok(Map.of("message", "Recorded"));
    }

    /** Seed problems (admin / internal endpoint to populate the problems pool). */
    @PostMapping("/problems/seed")
    public ResponseEntity<?> seedProblem(@RequestBody Problem problem) {
        if (problemRepo.existsByTitleSlug(problem.getTitleSlug()))
            return ResponseEntity.ok(Map.of("message", "already exists"));
        return ResponseEntity.ok(problemRepo.save(problem));
    }

    /** Browse available problems pool. */
    @GetMapping("/problems")
    public ResponseEntity<?> allProblems(
            @RequestParam(required = false) String difficulty) {
        if (difficulty != null && !difficulty.isBlank())
            return ResponseEntity.ok(problemRepo.findByDifficultyIgnoreCase(difficulty));
        return ResponseEntity.ok(problemRepo.findAll());
    }
}
