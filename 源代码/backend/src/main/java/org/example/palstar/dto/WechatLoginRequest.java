package org.example.palstar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class WechatLoginRequest {
    private String code;
    private String nickname;
    private String avatarUrl;
}
