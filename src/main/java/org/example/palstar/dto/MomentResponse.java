package org.example.palstar.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
public class MomentResponse {
    private Long id;
    private Long authorId;
    private String scene;
    private String title;
    private String content;
    private String location;
    private List<String> tags;
    private Integer status;
    private Integer reviewStatus;
    private Integer likeCount;
    private Integer favoriteCount;
    private Integer commentCount;
    private BigDecimal hotScore;
    private Boolean isLiked;
    private Boolean isFavorited;
    private Boolean isFollow;
    private Integer followerCount;
    private Integer followingCount;
    private List<MomentMediaResponse> media;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
