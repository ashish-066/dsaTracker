package com.example.dsa.challenge;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Seeds the {@code problems} table on first boot with a curated pool of
 * well-known LeetCode + Codeforces problems, so contest creation has
 * something to pick from right after a fresh deploy.
 *
 * <p>No-op if the table already has rows — the seeder only fires when the
 * DB is empty, so production redeploys don't clobber or duplicate data.
 *
 * <p>Intentionally hardcoded rather than fetched from the platforms at
 * startup because:
 * <ul>
 *   <li>LeetCode GraphQL is rate-limited and flaky on cold starts.</li>
 *   <li>A known-good static list makes the first contest demo reliable.</li>
 *   <li>Admins can always grow the pool via {@code POST /challenges/problems/seed}
 *       or direct SQL — this just guarantees the table is never empty.</li>
 * </ul>
 */
@Component
public class ProblemSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ProblemSeeder.class);
    private final ProblemRepository problemRepo;

    public ProblemSeeder(ProblemRepository problemRepo) {
        this.problemRepo = problemRepo;
    }

    @Override
    public void run(String... args) {
        long existing = problemRepo.count();
        if (existing > 0) {
            log.info("ProblemSeeder: {} problems already present — skipping seed", existing);
            return;
        }
        List<Problem> seed = buildSeed();
        problemRepo.saveAll(seed);
        log.info("ProblemSeeder: inserted {} problems into empty pool", seed.size());
    }

    /** Returns a ready-to-save list. Each call builds fresh instances. */
    private List<Problem> buildSeed() {
        List<Problem> out = new ArrayList<>();

        // ── LeetCode — Easy ────────────────────────────────────────────────
        out.add(lc("two-sum",                    "Two Sum",                    "Easy",   "arrays"));
        out.add(lc("valid-parentheses",          "Valid Parentheses",          "Easy",   "strings"));
        out.add(lc("merge-two-sorted-lists",     "Merge Two Sorted Lists",     "Easy",   "linked-list"));
        out.add(lc("best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "Easy", "arrays"));
        out.add(lc("valid-palindrome",           "Valid Palindrome",           "Easy",   "strings"));
        out.add(lc("invert-binary-tree",         "Invert Binary Tree",         "Easy",   "trees"));
        out.add(lc("maximum-depth-of-binary-tree","Maximum Depth of Binary Tree","Easy", "trees"));
        out.add(lc("linked-list-cycle",          "Linked List Cycle",          "Easy",   "linked-list"));
        out.add(lc("climbing-stairs",            "Climbing Stairs",            "Easy",   "dp"));
        out.add(lc("contains-duplicate",         "Contains Duplicate",         "Easy",   "arrays"));
        out.add(lc("valid-anagram",              "Valid Anagram",              "Easy",   "strings"));
        out.add(lc("binary-search",              "Binary Search",              "Easy",   "binary-search"));

        // ── LeetCode — Medium ──────────────────────────────────────────────
        out.add(lc("group-anagrams",             "Group Anagrams",             "Medium", "strings"));
        out.add(lc("top-k-frequent-elements",    "Top K Frequent Elements",    "Medium", "heap"));
        out.add(lc("product-of-array-except-self","Product of Array Except Self","Medium","arrays"));
        out.add(lc("longest-substring-without-repeating-characters", "Longest Substring Without Repeating Characters", "Medium", "strings"));
        out.add(lc("3sum",                       "3Sum",                       "Medium", "arrays"));
        out.add(lc("container-with-most-water",  "Container With Most Water",  "Medium", "arrays"));
        out.add(lc("longest-palindromic-substring","Longest Palindromic Substring","Medium","strings"));
        out.add(lc("coin-change",                "Coin Change",                "Medium", "dp"));
        out.add(lc("house-robber",               "House Robber",               "Medium", "dp"));
        out.add(lc("longest-increasing-subsequence","Longest Increasing Subsequence","Medium","dp"));
        out.add(lc("number-of-islands",          "Number of Islands",          "Medium", "graphs"));
        out.add(lc("clone-graph",                "Clone Graph",                "Medium", "graphs"));
        out.add(lc("course-schedule",            "Course Schedule",            "Medium", "graphs"));
        out.add(lc("validate-binary-search-tree","Validate Binary Search Tree","Medium", "trees"));
        out.add(lc("kth-smallest-element-in-a-bst","Kth Smallest Element in a BST","Medium","trees"));
        out.add(lc("lowest-common-ancestor-of-a-binary-search-tree","Lowest Common Ancestor of a Binary Search Tree","Medium","trees"));
        out.add(lc("search-in-rotated-sorted-array","Search in Rotated Sorted Array","Medium","binary-search"));
        out.add(lc("find-minimum-in-rotated-sorted-array","Find Minimum in Rotated Sorted Array","Medium","binary-search"));
        out.add(lc("word-break",                 "Word Break",                 "Medium", "dp"));
        out.add(lc("combination-sum",            "Combination Sum",            "Medium", "backtracking"));
        out.add(lc("permutations",               "Permutations",               "Medium", "backtracking"));

        // ── LeetCode — Hard ────────────────────────────────────────────────
        out.add(lc("trapping-rain-water",        "Trapping Rain Water",        "Hard",   "arrays"));
        out.add(lc("merge-k-sorted-lists",       "Merge k Sorted Lists",       "Hard",   "heap"));
        out.add(lc("median-of-two-sorted-arrays","Median of Two Sorted Arrays","Hard",   "binary-search"));
        out.add(lc("word-ladder",                "Word Ladder",                "Hard",   "graphs"));
        out.add(lc("serialize-and-deserialize-binary-tree","Serialize and Deserialize Binary Tree","Hard","trees"));
        out.add(lc("longest-consecutive-sequence","Longest Consecutive Sequence","Medium","arrays"));
        out.add(lc("edit-distance",              "Edit Distance",              "Hard",   "dp"));
        out.add(lc("regular-expression-matching","Regular Expression Matching","Hard",   "dp"));
        out.add(lc("sliding-window-maximum",     "Sliding Window Maximum",     "Hard",   "arrays"));

        // ── Codeforces — Easy (800–1100) ───────────────────────────────────
        out.add(cf("4-A",    "Watermelon",                "Easy",   "implementation", 4, "A"));
        out.add(cf("71-A",   "Way Too Long Words",        "Easy",   "strings",       71, "A"));
        out.add(cf("50-A",   "Domino piling",             "Easy",   "math",          50, "A"));
        out.add(cf("231-A",  "Team",                      "Easy",   "implementation", 231, "A"));
        out.add(cf("158-A",  "Next Round",                "Easy",   "implementation", 158, "A"));

        // ── Codeforces — Medium (1200–1600) ────────────────────────────────
        out.add(cf("1-A",    "Theatre Square",            "Medium", "math",           1, "A"));
        out.add(cf("118-A",  "String Task",               "Medium", "strings",      118, "A"));
        out.add(cf("339-A",  "Helpful Maths",             "Medium", "sorting",      339, "A"));
        out.add(cf("266-B",  "Queue at the School",       "Medium", "implementation", 266, "B"));
        out.add(cf("1272-A", "Three Friends",             "Medium", "greedy",      1272, "A"));

        // ── Codeforces — Hard (1700+) ──────────────────────────────────────
        out.add(cf("702-C",  "Cellular Network",          "Hard",   "binary-search", 702, "C"));
        out.add(cf("1398-C", "Good Subarrays",            "Hard",   "dp",          1398, "C"));
        out.add(cf("1343-D", "Constant Palindrome Sum",   "Hard",   "dp",          1343, "D"));

        return out;
    }

    /** Build a LeetCode Problem row. Slug is the canonical URL slug. */
    private static Problem lc(String slug, String title, String difficulty, String topic) {
        Problem p = new Problem();
        p.setTitleSlug(slug);
        p.setTitle(title);
        p.setDifficulty(difficulty);
        p.setPlatform("LeetCode");
        p.setTopic(topic);
        p.setProblemUrl("https://leetcode.com/problems/" + slug + "/");
        return p;
    }

    /**
     * Build a Codeforces Problem row. Slug format {@code "<contestId>-<index>"}
     * matches the convention {@code PlatformVerificationController} uses for
     * looking up Codeforces problems by (contestId, index).
     */
    private static Problem cf(String slug, String title, String difficulty, String topic,
                              int contestId, String index) {
        Problem p = new Problem();
        p.setTitleSlug(slug);
        p.setTitle(title);
        p.setDifficulty(difficulty);
        p.setPlatform("Codeforces");
        p.setTopic(topic);
        p.setProblemUrl("https://codeforces.com/problemset/problem/" + contestId + "/" + index);
        return p;
    }
}
