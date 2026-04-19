package com.example.dsa.challenge;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Records every problem each user has seen in a contest, so future contests
 * can exclude them for ~30 days and we don't hand players the same problem
 * twice in a row.
 *
 * <p>Keyed by (userEmail, titleSlug) with a uniqueness constraint — we don't
 * care how many contests showed the same slug to the same user, only
 * whether they've seen it at all. {@code seenAt} is stored so a scheduled
 * pruner can drop stale rows and the exclusion can honor a rolling window.
 *
 * <p>Indexed on (userEmail, seenAt) for fast "slugs seen in last N days"
 * lookups — the only query pattern we actually run.
 */
@Entity
@Table(
    name = "contest_problem_history",
    uniqueConstraints = @UniqueConstraint(columnNames = { "user_email", "title_slug" }),
    indexes = {
        @Index(name = "idx_cph_email_seen", columnList = "user_email,seen_at"),
    }
)
public class ContestProblemHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    /** Storing the slug (not the problem_id) keeps the table usable even if
     *  a problem row is later deleted/re-seeded — the exclusion stays valid. */
    @Column(name = "title_slug", nullable = false, length = 200)
    private String titleSlug;

    @Column(name = "seen_at", nullable = false)
    private Instant seenAt;

    public ContestProblemHistory() {}
    public ContestProblemHistory(String userEmail, String titleSlug) {
        this.userEmail = userEmail;
        this.titleSlug = titleSlug;
        this.seenAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String v) { this.userEmail = v; }
    public String getTitleSlug() { return titleSlug; }
    public void setTitleSlug(String v) { this.titleSlug = v; }
    public Instant getSeenAt() { return seenAt; }
    public void setSeenAt(Instant v) { this.seenAt = v; }
}
