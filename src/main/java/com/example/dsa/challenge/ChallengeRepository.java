package com.example.dsa.challenge;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    List<Challenge> findByOpponentIdOrderByCreatedAtDesc(String opponentId);

    List<Challenge> findByChallengerIdOrderByCreatedAtDesc(String challengerId);

    default List<Challenge> findAllInvolving(String userId) {
        List<Challenge> list = new java.util.ArrayList<>(findByChallengerIdOrderByCreatedAtDesc(userId));
        list.addAll(findByOpponentIdOrderByCreatedAtDesc(userId));
        list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return list;
    }

    // Pending challenges sent TO this user
    List<Challenge> findByOpponentIdAndStatus(String opponentId, ChallengeStatus status);

    // Check for existing pending challenge between same two users
    boolean existsByChallengerIdAndOpponentIdAndStatus(String challengerId, String opponentId, ChallengeStatus status);
}
