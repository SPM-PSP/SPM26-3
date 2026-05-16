package org.example.palstar.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MyCommentResponse {
    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private MomentInfo moment;

    @Data
    public static class MomentInfo {
        private Long id;
        private String title;
    }
}
