package org.example.palstar.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class MomentCommentResponse {
    private Long id;
    private Long momentId;
    private Long userId;
    private Long parentId;
    private Long replyToId;
    private String content;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
