package com.example.dsa.community;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByTopicIgnoreCaseOrderByCreatedAtDesc(String topic, Pageable pageable);

    List<Post> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByCreatedAtAfter(LocalDateTime since);

    /** Returns [authorName, postCount] pairs, top 3 by post count. */
    @Query("SELECT p.authorName, COUNT(p) FROM Post p GROUP BY p.authorName ORDER BY COUNT(p) DESC")
    List<Object[]> findTopContributors(Pageable pageable);
}
