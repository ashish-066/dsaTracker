package com.example.dsa.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByPostIdAndUserId(Long postId, String userId);

    boolean existsByPostIdAndUserId(Long postId, String userId);

    long countByPostId(Long postId);
}
