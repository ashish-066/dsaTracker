package com.example.dsa.community;

public class CreatePostRequest {
    private String title;
    private String topic;
    private String content;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String c) {
        this.content = c;
    }
}
