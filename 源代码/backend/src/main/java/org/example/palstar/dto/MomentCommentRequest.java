package org.example.palstar.dto;

import lombok.Data;

@Data
public class MomentCommentRequest {
    private String content;
    private Long parentId;
    private Long replyToId;
}
