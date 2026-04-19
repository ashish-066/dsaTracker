package com.example.dsa.challenge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Set;

@Repository
public interface ContestProblemHistoryRepository
        extends JpaRepository<ContestProblemHistory, Long> {

    boolean existsByUserEmailAndTitleSlug(String userEmail, String titleSlug);

    /**
     * Returns the set of slugs this user has seen in any contest since
     * {@code since}. Callers use this union-merged with the opponent's set
     * (plus already-solved slugs) to build the contest-pick exclusion list.
     */
    @Query("SELECT h.titleSlug FROM ContestProblemHistory h " +
           "WHERE h.userEmail = :email AND h.seenAt >= :since")
    Set<String> findSlugsByUserEmailSince(@Param("email") String userEmail,
                                          @Param("since") Instant since);

    /** Pruning support — drop rows older than cutoff. Returns count deleted. */
    long deleteBySeenAtBefore(Instant cutoff);
}
