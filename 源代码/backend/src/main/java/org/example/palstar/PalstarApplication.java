package org.example.palstar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PalstarApplication {

    public static void main(String[] args) {
        SpringApplication.run(PalstarApplication.class, args);
    }

}
