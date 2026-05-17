package org.example.palstar.dto;

import lombok.Data;

@Data
public class GroupMemberCountResponse {

    private Long groupId;

    private Integer memberCount;
}