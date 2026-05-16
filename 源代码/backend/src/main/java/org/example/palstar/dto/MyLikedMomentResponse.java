package org.example.palstar.dto;

import lombok.Data;

@Data
public class MyLikedMomentResponse {
    private Long id;
    private String title;
    private String coverUrl;
    private Integer likeCount;
    private AuthorInfo author;

    @Data
    public static class AuthorInfo {
        private Long id;
        private String nickname;
        private String avatarUrl;
    }
}
