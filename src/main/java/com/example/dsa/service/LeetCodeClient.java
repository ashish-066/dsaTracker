package com.example.dsa.service;

import com.example.dsa.entity.GraphQLResponse;
import com.example.dsa.entity.Submission;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class LeetCodeClient {

    private final WebClient webClient;

    public LeetCodeClient() {
        this.webClient = WebClient.builder()
                .baseUrl("https://leetcode.com/graphql")
                .build();
    }

    public List<Submission> fetchRecentSubmissions(String username) {

        String query = """
        query recentSubmissions($username: String!) {
          recentSubmissionList(username: $username) {
            titleSlug
            timestamp
            statusDisplay
          }
        }
        """;

        Map<String, Object> requestBody = Map.of(
                "query", query,
                "variables", Map.of("username", username)
        );

        GraphQLResponse response = webClient.post()
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(GraphQLResponse.class)
                .block();

        if (response != null && response.getData() != null) {
            return response.getData().getRecentSubmissionList();
        }

        return List.of();
    }
}
