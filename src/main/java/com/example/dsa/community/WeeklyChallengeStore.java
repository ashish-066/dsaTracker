package com.example.dsa.community;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Hardcoded weekly challenge rotation.
 *
 * TO ADD A NEW CHALLENGE — just append an entry to CHALLENGES below:
 *   Map.of(
 *       "title",        "Problem Name",
 *       "description",  "One-sentence description. X days left!",
 *       "difficulty",   "Easy" | "Medium" | "Hard",
 *       "url",          "https://leetcode.com/problems/problem-slug/",
 *       "participants", "1,234"   // display string
 *   )
 *
 * The current week's challenge is picked by (ISO week number % list size),
 * so the rotation advances automatically every Monday.
 */
@Component
public class WeeklyChallengeStore {

    // ─── ADD CHALLENGES HERE ───────────────────────────────────────────────
    private static final List<Map<String, String>> CHALLENGES = List.of(

        Map.of(
            "title",        "Trapping Rain Water",
            "description",  "Classic two-pointer / stack problem. A must-know for array interviews.",
            "difficulty",   "Hard",
            "url",          "https://leetcode.com/problems/trapping-rain-water/",
            "participants", "2,451"
        ),
        Map.of(
            "title",        "Longest Substring Without Repeating Characters",
            "description",  "Sliding window fundamentals. A top FAANG interview pick.",
            "difficulty",   "Medium",
            "url",          "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
            "participants", "1,873"
        ),
        Map.of(
            "title",        "Binary Tree Level Order Traversal",
            "description",  "Master BFS on trees — foundation for dozens of tree problems.",
            "difficulty",   "Medium",
            "url",          "https://leetcode.com/problems/binary-tree-level-order-traversal/",
            "participants", "1,204"
        ),
        Map.of(
            "title",        "Coin Change",
            "description",  "Canonical bottom-up DP. Understand this and most DP problems click.",
            "difficulty",   "Medium",
            "url",          "https://leetcode.com/problems/coin-change/",
            "participants", "987"
        ),
        Map.of(
            "title",        "Number of Islands",
            "description",  "BFS/DFS on a grid. One of the most common graph problems in interviews.",
            "difficulty",   "Medium",
            "url",          "https://leetcode.com/problems/number-of-islands/",
            "participants", "1,102"
        ),
        Map.of(
            "title",        "Merge K Sorted Lists",
            "description",  "Heap + merge patterns. A classic for system-design adjacent coding rounds.",
            "difficulty",   "Hard",
            "url",          "https://leetcode.com/problems/merge-k-sorted-lists/",
            "participants", "756"
        ),
        Map.of(
            "title",        "Word Break",
            "description",  "DP + hashing. Shows up in string + NLP-flavored interview questions.",
            "difficulty",   "Medium",
            "url",          "https://leetcode.com/problems/word-break/",
            "participants", "843"
        )
    );
    // ──────────────────────────────────────────────────────────────────────

    /** Returns this week's challenge as a plain map (title, description, difficulty, url, participants, daysLeft). */
    public Map<String, Object> current() {
        int weekNumber = LocalDate.now().get(WeekFields.of(Locale.getDefault()).weekOfWeekBasedYear());
        Map<String, String> c = CHALLENGES.get(weekNumber % CHALLENGES.size());

        // Days until next Monday
        int dayOfWeek = LocalDate.now().getDayOfWeek().getValue(); // Mon=1 … Sun=7
        int daysLeft = 8 - dayOfWeek; // Mon→7, Tue→6, … Sun→1

        return Map.of(
            "title",        c.get("title"),
            "description",  c.get("description"),
            "difficulty",   c.get("difficulty"),
            "url",          c.get("url"),
            "participants", c.get("participants"),
            "daysLeft",     daysLeft
        );
    }
}
