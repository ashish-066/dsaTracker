package com.example.dsa.entity;

import org.springframework.stereotype.Component;

@Component
public class VerifyAccount {
    private String username;
    private int pid;
    private String check;

    public String getusername() {
        return username;
    }

    public void setusername(String username) {
        this.username = username;
    }

    public int getpid() {
        return pid;
    }

    public void setpid(int pid) {
        this.pid = pid;
    }

    public String getcheck() {
        return check;
    }

    public void setcheck(String check) {
        this.check = check;
    }
}

