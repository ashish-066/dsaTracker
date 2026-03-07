package com.example.dsa.controller;

import com.example.dsa.service.CodeforcesClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/codeforces")
public class CodeforcesController {

    @Autowired
    CodeforcesClient codeforcesClient;

    /** Public endpoint — verifies a Codeforces handle exists */
    @GetMapping("/user/{handle}")
    public Map<String, Object> getUserInfo(@PathVariable String handle) {
        Map<String, Object> info = codeforcesClient.fetchUserInfo(handle);
        boolean exists = !"unrated".equals(info.get("rank")) || (int) info.get("rating") > 0
                || codeforcesClient.handleExists(handle);
        info.put("handle", handle);
        info.put("exists", exists);
        return info;
    }
}
