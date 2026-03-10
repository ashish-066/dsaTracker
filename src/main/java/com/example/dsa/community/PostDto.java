package com.example.dsa.community;

import java.time.LocalDateTime;

public class PostDto {
    private Long id;
    private String userId;
    private String authorName;
    private String title;
    private String topic;
    private String content;
    private String preview; // first 160 chars for feed cards
    private int likeCount;
    private boolean likedByMe;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PostDto from(Post p, boolean likedByMe) {
        PostDto d = new PostDto();
        d.id = p.getId();
        d.userId = p.getUserId();
        d.authorName = p.getAuthorName();
        d.title = p.getTitle();
        d.topic = p.getTopic();
        d.content = p.getContent();
        d.preview = p.getContent() != null && p.getContent().length() > 160
                ? p.getContent().substring(0, 160).trim() + "…"
                : p.getContent();
        d.likeCount = p.getLikeCount();
        d.likedByMe = likedByMe;
        d.createdAt = p.getCreatedAt();
        d.updatedAt = p.getUpdatedAt();
        return d;
    }

    /* ── getters ── */
    public Long getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public String getTitle() {
        return title;
    }

    public String getTopic() {
        return topic;
    }

    public String getContent() {
        return content;
    }

    public String getPreview() {
        return preview;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public boolean isLikedByMe() {
        return likedByMe;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
