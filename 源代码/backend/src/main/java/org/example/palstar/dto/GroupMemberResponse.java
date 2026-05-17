package org.example.palstar.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class GroupMemberResponse {

    private Long userId;

    private String nickname;

    private String avatarUrl;

    private Integer role;       // 0普通成员 1管理员 2群主

    private Integer joinSource; // 0申请通过 1被邀请 2直接创建

    private LocalDateTime joinedAt;
}