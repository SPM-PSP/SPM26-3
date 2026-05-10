package org.example.palstar.dto;

import lombok.Data;

@Data
public class MomentMediaRequest {
    private Integer mediaType;
    private String mediaUrl;
    private Integer sortNo;
}
