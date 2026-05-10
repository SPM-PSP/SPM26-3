package org.example.palstar.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class UserFollowResponse {
    private Long followerId;
    private Long followingId;
    private Integer status;
    private LocalDateTime createdAt;
}
