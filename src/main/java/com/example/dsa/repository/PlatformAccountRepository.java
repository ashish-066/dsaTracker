package com.example.dsa.repository;

import com.example.dsa.entity.PlatformAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformAccountRepository extends JpaRepository<PlatformAccount, Long> {
    List<PlatformAccount> findByUserId(String userId);

    Optional<PlatformAccount> findByUserIdAndPlatformName(String userId, String platformName);

    void deleteByUserIdAndPlatformName(String userId, String platformName);
}
