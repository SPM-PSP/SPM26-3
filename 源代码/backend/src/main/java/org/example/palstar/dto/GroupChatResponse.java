package org.example.palstar.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupChatResponse {

    private Long id;

    private String name;

    private Long postId;

    private Long ownerId;

    private Integer memberCount;

    private LocalDateTime createdAt;
}