package org.example.palstar.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupMessageResponse {

    private Long id;

    private Long groupId;

    private Long senderId;

    // 0:文本  1:图片  2:系统消息
    private Integer msgType;

    private String content;

    private String mediaUrl;

    private LocalDateTime createdAt;
}