package org.example.palstar.dto;

import lombok.Data;

@Data
public class GroupMessageSendRequest {

    // 0:文本  1:图片
    private Integer msgType;

    private String content;

    private String mediaUrl;
}