package org.example.palstar.dto;

import java.util.List;
import lombok.Data;

@Data
public class UserPublicProfileResponse {
    private Long id;
    private String nickname;
    private String avatarUrl;
    private String bio;
    private String school;
    private String grade;
    private Integer gender;
    private List<String> interestTags;
    private Integer verifyStatus;
    private Boolean isFollow;
    private Integer followerCount;
    private Integer followingCount;
}
