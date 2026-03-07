package com.example.dsa.challenge;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChallengeAttemptRepository extends JpaRepository<ChallengeAttempt, Long> {
    List<ChallengeAttempt> findByChallengeId(Long challengeId);

    List<ChallengeAttempt> findByChallengeIdAndUserId(Long challengeId, String userId);

    Optional<ChallengeAttempt> findByChallengeIdAndUserIdAndProblemId(Long challengeId, String userId, Long problemId);

    long countByChallengeIdAndUserIdAndSolvedTrue(Long challengeId, String userId);
}
