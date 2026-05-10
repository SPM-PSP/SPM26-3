package org.example.palstar.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserProfileUpdateRequest {
    private String nickname;
    private String avatarUrl; // 添加头像URL字段
    private String bio;
    private String grade;
    private String school;
    private Integer gender;
    private List<String> interestTags;
}
