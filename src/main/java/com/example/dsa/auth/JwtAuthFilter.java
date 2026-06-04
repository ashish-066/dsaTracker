package com.example.dsa.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;

    @Autowired
    public JwtAuthFilter(UserDetailsService userDetailsService, JwtService jwtService) {
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // Prefer the HttpOnly auth cookie (XSS-safe); fall back to Authorization
        // header so legacy/native API clients that send Bearer tokens still work.
        String token = readTokenFromCookie(request);
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        String username = null;
        boolean isPublic = isPublicEndpoint(request.getRequestURI());

        if (token != null) {
            try {
                username = jwtService.extractUsername(token);
            } catch (Exception e) {
                if (!isPublic) {
                    sendJsonError(response, HttpStatus.UNAUTHORIZED, "Token expired or invalid. Please log in again.");
                    return;
                }
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                if (jwtService.validateToken(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    if (!isPublic) {
                        sendJsonError(response, HttpStatus.UNAUTHORIZED, "Token validation failed. Please log in again.");
                        return;
                    }
                }
            } catch (Exception e) {
                if (!isPublic) {
                    sendJsonError(response, HttpStatus.UNAUTHORIZED, "Authentication error. Please log in again.");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String uri) {
        return uri.equals("/auth/welcome") ||
               uri.equals("/auth/generateToken") ||
               uri.startsWith("/auth/signup/") ||
               uri.equals("/auth/username/check") ||
               uri.equals("/auth/logout") ||
               uri.startsWith("/api/leetcode/") ||
               uri.startsWith("/api/codeforces/") ||
               uri.equals("/challenges/problems/seed");
    }

    private void sendJsonError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"" + message + "\",\"status\":" + status.value() + "}");
    }

    /** Read the JWT from the HttpOnly auth cookie. Returns null if absent. */
    private static String readTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if ("jwt".equals(c.getName())) {
                String v = c.getValue();
                return (v == null || v.isEmpty()) ? null : v;
            }
        }
        return null;
    }
}
