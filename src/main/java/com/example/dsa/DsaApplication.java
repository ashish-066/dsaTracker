package com.example.dsa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DsaApplication {

    public static void main(String[] args) {
        try {
            SpringApplication.run(DsaApplication.class, args);
        } catch (Throwable e) {
            e.printStackTrace();
            System.err.println("STARTUP FAILED");
        }
    }

}
