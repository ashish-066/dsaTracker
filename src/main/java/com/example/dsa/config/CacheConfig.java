package com.example.dsa.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Simple in-memory cache manager.
     * Cache names:
     * "problems" — LeetCode problem pool per topic+difficulty (invalidated every 6h
     * via @Scheduled)
     * "daily_recs" — per-user daily recommendations (invalidated every 24h)
     */
    @Bean
    @Primary
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("problems", "daily_recs");
    }
}
