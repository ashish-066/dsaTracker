package com.example.dsa.controller;


import com.example.dsa.entity.VerifyAccount;
import com.example.dsa.service.AccountService;
import com.example.dsa.service.LeetCodeClient;
import com.example.dsa.entity.Submission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leetcode")
public class LeetcodeController {
    
    @Autowired
    AccountService accservice;
    
    @Autowired
    LeetCodeClient leetCodeClient;

    @PostMapping("/verify")
    public VerifyAccount verifyAccount(@RequestBody VerifyAccount account) {
        return accservice.verifyaccount(account);
    }

    // Test endpoint to fetch submissions
    @GetMapping("/submissions/{username}")
    public Map<String, Object> getSubmissions(@PathVariable String username) {
        List<Submission> submissions = leetCodeClient.fetchRecentSubmissions(username);
        return Map.of(
                "username", username,
                "submissionCount", submissions.size(),
                "submissions", submissions
        );
    }

    // Test endpoint to verify specific submission
    @PostMapping("/verify-submission")
    public Map<String, Object> verifySubmission(
            @RequestParam String username,
            @RequestParam String problemSlug) {
        
        LocalDateTime startTime = LocalDateTime.now().minusHours(24);
        boolean isVerified = accservice.verify(username, problemSlug, startTime);
        
        return Map.of(
                "username", username,
                "problemSlug", problemSlug,
                "verified", isVerified,
                "message", isVerified ? "Submission verified!" : "No matching submission found"
        );
    }
}

