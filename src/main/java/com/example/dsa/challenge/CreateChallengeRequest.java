package com.example.dsa.challenge;

public class CreateChallengeRequest {
    private String opponentEmail;
    private String contestType; // BEGINNER / MEDIUM / HARD

    public String getOpponentEmail() {
        return opponentEmail;
    }

    public void setOpponentEmail(String opponentEmail) {
        this.opponentEmail = opponentEmail;
    }

    public String getContestType() {
        return contestType;
    }

    public void setContestType(String contestType) {
        this.contestType = contestType;
    }
}
