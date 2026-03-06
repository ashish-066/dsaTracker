package com.example.dsa.controller;

import com.example.dsa.entity.Submission;
import com.example.dsa.service.LeetCodeClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leetcode")
public class LeetcodeController {

    @Autowired
    LeetCodeClient leetCodeClient;

    /** Public endpoint — verifies a LeetCode username exists by fetching recent submissions */
    @GetMapping("/submissions/{username}")
    public Map<String, Object> getSubmissions(@PathVariable String username) {
        List<Submission> submissions = leetCodeClient.fetchRecentSubmissions(username);
        return Map.of(
                "username", username,
                "submissionCount", submissions.size(),
                "submissions", submissions
        );
    }
}
