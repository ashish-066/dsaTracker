package com.example.dsa.challenge;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChallengeProblemRepository extends JpaRepository<ChallengeProblem, Long> {
    List<ChallengeProblem> findByChallengeIdOrderByProblemOrder(Long challengeId);

    void deleteByChallengeId(Long challengeId);
}
