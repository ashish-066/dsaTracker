package com.example.dsa.service;

import com.example.dsa.entity.Submission;
import com.example.dsa.entity.VerifyAccount;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
public class AccountService {
    
    @Autowired
    private LeetCodeClient leetCodeClient;

    public boolean verify(String username, String problemSlug, LocalDateTime startTime) {
        
        List<Submission> submissions = leetCodeClient.fetchRecentSubmissions(username);

        for (Submission s : submissions) {
            
            if (s.getTitleSlug().equals(problemSlug) 
                    && s.getStatusDisplay().equals("Accepted")) {

                long ts = Long.parseLong(s.getTimestamp());

                LocalDateTime submissionTime = 
                        Instant.ofEpochSecond(ts)
                                .atZone(ZoneId.systemDefault())
                                .toLocalDateTime();

                if (submissionTime.isAfter(startTime)) {
                    return true;
                }
            }
        }

        return false;
    }

    public VerifyAccount verifyaccount(VerifyAccount account) {
        String username = account.getusername();
        int pid = account.getpid();

        return account;
    }
}

