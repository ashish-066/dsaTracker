package com.example.dsa.challenge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByDifficultyIgnoreCase(String difficulty);

    Optional<Problem> findByTitleSlug(String titleSlug);

    List<Problem> findByTopicIgnoreCaseAndDifficultyIgnoreCase(String topic, String difficulty);

    List<Problem> findByTopicIgnoreCase(String topic);

    @Query("SELECT p FROM Problem p WHERE LOWER(p.difficulty) = LOWER(:diff) ORDER BY RAND()")
    List<Problem> findRandomByDifficulty(@Param("diff") String difficulty);

    boolean existsByTitleSlug(String titleSlug);
}
