package com.example.dsa.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GoogleOAuthService {

    private static final String GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final List<String> TRUSTED_ISSUERS = List.of(
            "https://accounts.google.com",
            "accounts.google.com");

    private final String clientId;
    private volatile JwtDecoder decoder;

    public GoogleOAuthService(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public GoogleProfile verifyIdToken(String idToken) {
        if (clientId.isBlank()) {
            throw new IllegalStateException("Google OAuth is not configured");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Missing Google credential");
        }

        Jwt jwt;
        try {
            jwt = decoder().decode(idToken);
        } catch (JwtException e) {
            throw new IllegalArgumentException("Invalid Google credential");
        }

        String issuer = jwt.getIssuer() == null ? "" : jwt.getIssuer().toString();
        if (!TRUSTED_ISSUERS.contains(issuer)) {
            throw new IllegalArgumentException("Untrusted Google credential issuer");
        }
        if (!jwt.getAudience().contains(clientId)) {
            throw new IllegalArgumentException("Google credential audience mismatch");
        }
        if (!Boolean.TRUE.equals(jwt.getClaim("email_verified"))) {
            throw new IllegalArgumentException("Google email is not verified");
        }

        String email = clean(jwt.getClaimAsString("email"));
        if (email == null) {
            throw new IllegalArgumentException("Google credential is missing email");
        }
        return new GoogleProfile(
                email.toLowerCase(),
                clean(jwt.getClaimAsString("name")),
                clean(jwt.getClaimAsString("picture")));
    }

    private JwtDecoder decoder() {
        JwtDecoder local = decoder;
        if (local == null) {
            synchronized (this) {
                local = decoder;
                if (local == null) {
                    NimbusJwtDecoder nimbus = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWKS_URI).build();
                    OAuth2TokenValidator<Jwt> validator =
                            new DelegatingOAuth2TokenValidator<>(new JwtTimestampValidator());
                    nimbus.setJwtValidator(validator);
                    decoder = nimbus;
                    local = nimbus;
                }
            }
        }
        return local;
    }

    private static String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public record GoogleProfile(String email, String name, String picture) {
    }
}
