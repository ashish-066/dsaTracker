package com.example.dsa.repository;

import com.example.dsa.entity.TopicStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicStatsRepository extends JpaRepository<TopicStats, Long> {
    List<TopicStats> findByUserId(String userId);

    void deleteByUserId(String userId);
}
