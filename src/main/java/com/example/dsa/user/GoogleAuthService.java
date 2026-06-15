package com.example.dsa.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.Map;

@Service
public class GoogleAuthService {

    private final String clientId;
    private final WebClient webClient;

    public GoogleAuthService(
            @Value("${app.google.client-id:}") String clientId,
            WebClient.Builder webClientBuilder) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.webClient = webClientBuilder
                .baseUrl("https://oauth2.googleapis.com")
                .build();
    }

    public GoogleProfile verify(String credential) {
        if (clientId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Google sign-in is not configured");
        }
        if (credential == null || credential.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google credential is required");
        }

        Map<?, ?> tokenInfo;
        try {
            tokenInfo = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tokeninfo")
                            .queryParam("id_token", credential)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(5));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google credential");
        }

        String audience = value(tokenInfo, "aud");
        String subject = value(tokenInfo, "sub");
        String email = value(tokenInfo, "email");
        String verified = value(tokenInfo, "email_verified");

        if (!clientId.equals(audience) || subject.isBlank() || email.isBlank() || !"true".equalsIgnoreCase(verified)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google credential could not be verified");
        }

        return new GoogleProfile(
                subject,
                email.toLowerCase(),
                value(tokenInfo, "name"),
                value(tokenInfo, "picture"));
    }

    private static String value(Map<?, ?> map, String key) {
        if (map == null) return "";
        Object value = map.get(key);
        return value == null ? "" : value.toString();
    }

    public record GoogleProfile(String subject, String email, String name, String picture) {}
}
