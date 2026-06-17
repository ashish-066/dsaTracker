package com.example.dsa.platform;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GfgClient {

    private static final String GFG_PROFILE_URL = "https://www.geeksforgeeks.org/user/%s/";

    public Map<String, Object> fetchProfileStats(String username) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalSolved", 0);
        result.put("easySolved", 0);
        result.put("mediumSolved", 0);
        result.put("hardSolved", 0);
        result.put("currentStreak", 0);
        result.put("longestStreak", 0);
        result.put("topics", new LinkedHashMap<String, Integer>());
        result.put("calendar", new LinkedHashMap<String, Integer>());

        if (username == null || username.isBlank())
            return result;

        try {
            String url = String.format(GFG_PROFILE_URL, username);
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .timeout(15000)
                    .get();

            String htmlRaw = doc.html();
            String htmlText = doc.body().text();

            // 1. Try extracting from JSON payload (New Next.js Structure)
            int jsonTotal = extractJsonValue(htmlRaw, "total_problems_solved");
            int jsonStreak = extractJsonValue(htmlRaw, "pod_solved_current_streak");
            int jsonLongestStreak = extractJsonValue(htmlRaw, "pod_solved_longest_streak");

            if (jsonTotal > 0) {
                result.put("totalSolved", jsonTotal);
                result.put("currentStreak", jsonStreak);
                result.put("longestStreak", jsonLongestStreak);
                // Difficulty stats are usually hidden in the new structure, so they stay 0.
            } else {
                // 2. Fallback to Text-based extraction (Old HTML Structure)
                result.put("easySolved", extractCount(htmlText, "Easy"));
                result.put("mediumSolved", extractCount(htmlText, "Medium"));
                result.put("hardSolved", extractCount(htmlText, "Hard"));

                int easy = (int) result.get("easySolved");
                int medium = (int) result.get("mediumSolved");
                int hard = (int) result.get("hardSolved");

                int explicitTotal = extractCount(htmlText, "Problems Solved");
                if (explicitTotal > 0) {
                    result.put("totalSolved", explicitTotal);
                } else {
                    int school = extractCount(htmlText, "School");
                    int basic = extractCount(htmlText, "Basic");
                    result.put("totalSolved", easy + medium + hard + school + basic);
                }

                int streak = extractCount(htmlText, "Current Streak");
                if (streak == 0)
                    streak = extractCount(htmlText, "Streak");
                result.put("currentStreak", streak);
            }

            // Extract Skills
            Map<String, Integer> topics = extractSkills(htmlRaw);
            if (!topics.isEmpty()) {
                result.put("topics", topics);
            }

        } catch (Exception e) {
            // Ignore parsing errors, return zeros
        }
        return result;
    }

    private int extractJsonValue(String text, String key) {
        Pattern pattern = Pattern.compile(Pattern.quote(key) + "\\\\?\"?\\s*:\\s*(\\d+)");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (Exception e) {}
        }
        return 0;
    }

    private int extractCount(String text, String label) {
        Pattern pattern = Pattern.compile("(?i)" + Pattern.quote(label) + "\\s*(?:\\(|:)?\\s*(\\d+)");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (Exception e) {}
        }
        return 0;
    }

    private Map<String, Integer> extractSkills(String htmlRaw) {
        Map<String, Integer> skills = new LinkedHashMap<>();
        String upper = htmlRaw.toUpperCase();
        if (upper.contains("C++")) skills.put("C++", 1);
        if (upper.contains("JAVA") && !upper.contains("JAVASCRIPT")) skills.put("Java", 1);
        if (upper.contains("PYTHON")) skills.put("Python", 1);
        return skills;
    }

    public boolean userExists(String username) {
        if (username == null || username.isBlank())
            return false;
        try {
            String url = String.format(GFG_PROFILE_URL, username);
            org.jsoup.Connection.Response response = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .timeout(10000)
                    .execute();
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }
}
